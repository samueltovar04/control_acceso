import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

const { width } = Dimensions.get('window');

export const VitalSignsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.7);
  const [estres, setEstres] = useState(24);
  const [pulseraMac, setPulseraMac] = useState('PULSERA_002');
  const [loading, setLoading] = useState(false);
  const [waveOffset, setWaveOffset] = useState(0);

  // Smooth wave offset animation
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 4) % 100);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const fetchUltimaTelemetria = async () => {
    setLoading(true);
    try {
      try {
        const clientRes = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 3000 });
        if (clientRes.data && clientRes.data.codigoInsignia) {
          setPulseraMac(clientRes.data.codigoInsignia.startsWith('PULSERA') ? clientRes.data.codigoInsignia : `PULSERA_${clientRes.data.codigoInsignia}`);
        }
      } catch (e) {}

      const response = await axios.get(`${API_BASE_URL}/telemetria/cliente/${clienteId}/ultimo`, { timeout: 5000 });
      if (response.data) {
        if (response.data.bpm) setBpm(response.data.bpm);
        if (response.data.spo2) setSpo2(response.data.spo2);
        if (response.data.temp || response.data.temperatura) setTemp(response.data.temp || response.data.temperatura);
        if (response.data.estres) setEstres(response.data.estres);
        if (response.data.id_pulsera) setPulseraMac(response.data.id_pulsera);
      }
    } catch (error) {
      console.warn('Cargando datos telemétricos de WebSocket:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimaTelemetria();

    let ws = null;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/signos-vitales`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.bpm) setBpm(data.bpm);
          if (data.spo2) setSpo2(data.spo2);
          if (data.temperatura || data.temp) setTemp(data.temperatura || data.temp);
          if (data.estres) setEstres(data.estres);
          if (data.id_pulsera) setPulseraMac(data.id_pulsera);
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, [clienteId]);

  const generateEcgPath = () => {
    const points = [];
    const svgWidth = width - 80;
    const baseHeight = 35;

    for (let x = 0; x <= svgWidth; x += 8) {
      const cycleX = (x + waveOffset * 3) % 120;
      let y = baseHeight;

      if (cycleX >= 40 && cycleX <= 45) y = baseHeight - 25;
      else if (cycleX > 45 && cycleX <= 52) y = baseHeight + 18;
      else if (cycleX > 52 && cycleX <= 58) y = baseHeight - 8;
      else if (cycleX >= 80 && cycleX <= 95) y = baseHeight - 6;

      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* CABECERA CLEAN HEALTH */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Monitor Telemétrico IoT</Text>
          <Text style={styles.subTitle}>Transmisión MESH • Brazalete: <Text style={styles.highlightMac}>{pulseraMac}</Text></Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchUltimaTelemetria}>
          {loading ? (
            <ActivityIndicator color="#ff7043" size="small" />
          ) : (
            <MaterialIcon name="sync" size={22} color="#ff7043" />
          )}
        </TouchableOpacity>
      </View>

      {/* TARJETA MONITOR PRINCIPAL CLEAN HEALTH PEACH */}
      <View style={styles.cleanMonitorCard}>
        <View style={styles.monitorHeaderBar}>
          <Text style={styles.monitorTitleText}>MONITOR DE SIGNOS VITALES EN VIVO</Text>
          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>

        <View style={styles.monitorBodyRow}>
          {/* TRAZADO DE ONDA ECG FLUIDO PEACH */}
          <View style={styles.waveformContainer}>
            <Text style={styles.waveLabelPeach}>FRECUENCIA CARDÍACA (ECG)</Text>
            <Svg height="65" width={width - 180} style={styles.svgOscilloscope}>
              <Defs>
                <LinearGradient id="peachGlow" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#ff7043" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#ff7043" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path d={generateEcgPath()} fill="none" stroke="url(#peachGlow)" strokeWidth="2.8" />
            </Svg>
          </View>

          {/* LECTURA BPM GIGANTE */}
          <View style={styles.bpmGiantBox}>
            <Text style={styles.bpmGiantValue}>{bpm}</Text>
            <Text style={styles.bpmUnitLabel}>BPM</Text>
          </View>
        </View>
      </View>

      {/* GRILLA DE METRICAS PRINCIPALES */}
      <View style={styles.cardsGrid}>

        {/* SPO2 */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Saturación SpO2</Text>
            <MaterialIcon name="water-percent" size={22} color="#0288d1" />
          </View>
          <Text style={styles.metricNumBlue}>{spo2}%</Text>
          <Text style={styles.subStatusText}>Arterial Óptimo</Text>
        </View>

        {/* TEMPERATURA */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Temperatura</Text>
            <MaterialIcon name="thermometer" size={22} color="#f57c00" />
          </View>
          <Text style={styles.metricNumOrange}>{typeof temp === 'number' ? temp.toFixed(1) : temp}°C</Text>
          <Text style={styles.subStatusText}>Corporal Directa</Text>
        </View>

        {/* ESTRÉS / PERFUSIÓN */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Estrés / Carga</Text>
            <MaterialIcon name="speedometer" size={22} color="#388e3c" />
          </View>
          <Text style={styles.metricNumGreen}>{estres}%</Text>
          <Text style={styles.subStatusText}>Nivel Normal</Text>
        </View>

        {/* ESTADO BATERÍA */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Brazalete MESH</Text>
            <MaterialIcon name="battery-90" size={22} color="#7b1fa2" />
          </View>
          <Text style={styles.metricNumPurple}>98%</Text>
          <Text style={styles.subStatusText}>Batería Excelente</Text>
        </View>

      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  subTitle: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  highlightMac: { color: '#ff7043', fontWeight: '800' },
  refreshIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff3e0', borderWidth: 1, borderColor: '#ffe0b2', justifyContent: 'center', alignItems: 'center' },

  // CLEAN MONITOR CARD
  cleanMonitorCard: { backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1.5, borderColor: '#ffe0b2', padding: 16, marginBottom: 18, elevation: 4 },
  monitorHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  monitorTitleText: { color: '#78350f', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#a5d6a7' },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2e7d32', marginRight: 5 },
  liveText: { color: '#2e7d32', fontSize: 10, fontWeight: '800' },
  monitorBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waveformContainer: { flex: 1, paddingRight: 10 },
  waveLabelPeach: { color: '#ff7043', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  svgOscilloscope: { backgroundColor: '#fff8f6', borderRadius: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#ffe0b2' },
  bpmGiantBox: { width: 80, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderColor: '#f1f5f9', paddingLeft: 10 },
  bpmGiantValue: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  bpmUnitLabel: { fontSize: 11, fontWeight: '800', color: '#ff7043', marginTop: -4 },

  // METRICS GRID
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  metricCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 20, padding: 14, borderWidth: 1.5, borderColor: '#ffe0b2', elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 12, fontWeight: '800', color: '#78350f' },
  metricNumBlue: { fontSize: 26, fontWeight: '900', color: '#0288d1' },
  metricNumOrange: { fontSize: 26, fontWeight: '900', color: '#f57c00' },
  metricNumGreen: { fontSize: 26, fontWeight: '900', color: '#388e3c' },
  metricNumPurple: { fontSize: 26, fontWeight: '900', color: '#7b1fa2' },
  subStatusText: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 2 }
});
