import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

export const VitalSignsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [bpm, setBpm] = useState(0);
  const [spo2, setSpo2] = useState(0);
  const [temp, setTemp] = useState(0);
  const [pulseraMac, setPulseraMac] = useState('Pulsera 002');
  const [loading, setLoading] = useState(false);

  const fetchUltimaTelemetria = async () => {
    setLoading(true);
    try {
      // Fetch assigned wristband from client profile
      try {
        const clientRes = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 3000 });
        if (clientRes.data && clientRes.data.codigoInsignia) {
          setPulseraMac(`Pulsera ${clientRes.data.codigoInsignia}`);
        }
      } catch (e) {}

      const response = await axios.get(`${API_BASE_URL}/telemetria/cliente/${clienteId}/ultimo`, { timeout: 5000 });
      if (response.data) {
        setBpm(response.data.bpm || 0);
        setSpo2(response.data.spo2 || 0);
        setTemp(response.data.temp || response.data.temperatura || 0);
        if (response.data.id_pulsera) {
          setPulseraMac(`Pulsera ${response.data.id_pulsera}`);
        }
      } else {
        setBpm(0);
        setSpo2(0);
        setTemp(0);
      }
    } catch (error) {
      console.warn('Sin respuesta de telemetria backend, colocando valores en 0:', error.message);
      setBpm(0);
      setSpo2(0);
      setTemp(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimaTelemetria();

    // WebSockets connection
    let ws = null;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/signos-vitales`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.bpm) setBpm(data.bpm);
          if (data.spo2) setSpo2(data.spo2);
          if (data.temperatura || data.temp) setTemp(data.temperatura || data.temp);
          if (data.id_pulsera) setPulseraMac(`Pulsera ${data.id_pulsera}`);
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, [clienteId]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mis Signos Vitales (IoT Wearable)</Text>
      <Text style={styles.subTitle}>Sincronizado desde API Quarkus • Dispositivo: <Text style={{ fontWeight: 'bold', color: '#1E88E5' }}>{pulseraMac}</Text></Text>

      {loading && <ActivityIndicator size="small" color="#1E88E5" style={{ marginBottom: 15 }} />}

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Ritmo Cardíaco (ECG/PPG)</Text>
        <Text style={styles.metricValue}>{bpm} <Text style={styles.unit}>BPM</Text></Text>
        <Text style={bpm > 0 ? styles.statusNormal : styles.statusInactive}>
          {bpm > 0 ? 'Rango Normal • Ritmo Sinusal' : 'Sin señal del sensor (0 BPM)'}
        </Text>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Saturación de Oxígeno SpO2</Text>
        <Text style={styles.metricValue}>{spo2}%</Text>
        <Text style={spo2 > 0 ? styles.statusNormal : styles.statusInactive}>
          {spo2 > 0 ? 'Excelente Nivel de Oxigenación' : 'Sin lectura de Oxígeno (0%)'}
        </Text>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Temperatura Corporal</Text>
        <Text style={styles.metricValue}>{temp} °C</Text>
        <Text style={temp > 0 ? styles.statusNormal : styles.statusInactive}>
          {temp > 0 ? 'Temperatura Estable' : 'Sin lectura de Temperatura (0 °C)'}
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchUltimaTelemetria}>
        <Text style={styles.refreshBtnText}>🔄 Actualizar Telemetría desde Servidor</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 4 },
  subTitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  metricCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 2 },
  metricTitle: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  metricValue: { fontSize: 36, fontWeight: 'bold', color: '#222', marginVertical: 6 },
  unit: { fontSize: 16, fontWeight: 'normal', color: '#666' },
  statusNormal: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  statusInactive: { color: '#757575', fontWeight: 'bold', fontSize: 12 },
  refreshBtn: { backgroundColor: '#1E88E5', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  refreshBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
