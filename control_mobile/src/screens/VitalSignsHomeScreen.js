import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { getBrandingConfig } from '../services/brandingService';

export const VitalSignsHomeScreen = ({ navigation }) => {
  const [branding, setBranding] = useState(null);
  const [bpm, setBpm] = useState(74);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.6);
  const [btScanning, setBtScanning] = useState(false);
  const [btConnected, setBtConnected] = useState(true);
  const [connectedDevice, setConnectedDevice] = useState('ESP32-Wearable-Vital-01');

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));

    // Simulation of subtle vital signs oscillation
    const interval = setInterval(() => {
      setBpm(prev => Math.floor(72 + Math.random() * 6));
      setSpo2(prev => Math.floor(97 + Math.random() * 3));
      setTemp(prev => parseFloat((36.5 + Math.random() * 0.3).toFixed(1)));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleScanBluetooth = () => {
    setBtScanning(true);
    setTimeout(() => {
      setBtScanning(false);
      Alert.alert('Escanear Bluetooth', 'Se encontró el wearable "ESP32-Wearable-Vital-01" en la red cercana.');
    }, 2000);
  };

  const toggleBluetoothConnection = () => {
    if (btConnected) {
      setBtConnected(false);
      Alert.alert('Bluetooth Desconectado', 'Sensor wearable desconectado.');
    } else {
      setBtConnected(true);
      Alert.alert('Bluetooth Conectado', 'Sensor ESP32-Wearable-Vital-01 sincronizado correctamente.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* CABECERA SUPERIOR DE ACCESO Y LOGIN */}
      <View style={[styles.header, { backgroundColor: branding?.colorPrimary || '#1E88E5' }]}>
        <View style={styles.headerTop}>
          {branding?.logoMenuUrl ? (
            <Image source={{ uri: branding.logoMenuUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <Text style={styles.logoText}>🩺</Text>
          )}
          <Text style={styles.headerTitle}>{branding?.nombreEmpresa || 'Control de Acceso'}</Text>
        </View>

        <Text style={styles.headerSub}>Monitoreo en Tiempo Real & Control Biométrico</Text>

        {/* ACCESOS DIRECTOS DE AUTENTICACION Y REGISTRO */}
        <View style={styles.authActionsRow}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>🔑 Ingresar / Mi Cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerBtnText}>📝 Registrarme</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>

        {/* MONITOR DE SIGNOS VITALES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}> Visualización de Signos Vitales</Text>
          <Text style={styles.sectionSub}>Lectura continua desde dispositivo wearable IoT</Text>
        </View>

        {/* ANIMATED PULSE CARD */}
        <View style={styles.ecgCard}>
          <View style={styles.ecgHeader}>
            <Text style={styles.ecgTitle}>Frecuencia Cardíaca (ECG/PPG)</Text>
            <View style={[styles.statusBadge, { backgroundColor: btConnected ? '#e8f5e9' : '#ffebee' }]}>
              <Text style={[styles.statusBadgeText, { color: btConnected ? '#2e7d32' : '#c62828' }]}>
                {btConnected ? '● EN VIVO' : '○ DESCONECTADO'}
              </Text>
            </View>
          </View>

          <View style={styles.bpmRow}>
            <Text style={styles.bpmValue}>{bpm}</Text>
            <Text style={styles.bpmUnit}>BPM</Text>
            <Text style={styles.ecgWave}>📈 ~/\_/\_/\~</Text>
          </View>
          <Text style={styles.bpmStatus}>Ritmo Sinusal Normal - 74 BPM Promedio</Text>
        </View>

        {/* SPO2 AND TEMP GRID */}
        <View style={styles.gridRow}>
          <View style={styles.smallMetricCard}>
            <Text style={styles.metricLabel}>Oxígeno SpO2</Text>
            <Text style={styles.metricVal}>{spo2}%</Text>

          </View>

          <View style={styles.smallMetricCard}>
            <Text style={styles.metricLabel}>Temperatura</Text>
            <Text style={styles.metricVal}>{temp} °C</Text>

          </View>
        </View>

        {/* PANEL DE CONFIGURACION BLUETOOTH */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}> Configuración de Dispositivo Bluetooth</Text>
          <Text style={styles.sectionSub}>Vinculación BLE con torniquetes y sensores vitales</Text>
        </View>

        <View style={styles.btCard}>
          <View style={styles.btRow}>
            <View>
              <Text style={styles.btDeviceName}>{connectedDevice}</Text>
              <Text style={styles.btDeviceDetails}>
                {btConnected ? 'BLE 5.0 • Señal: -62 dBm • Batería: 88%' : 'Sin dispositivo activo'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtBtn, { backgroundColor: btConnected ? '#c62828' : '#2e7d32' }]}
              onPress={toggleBluetoothConnection}
            >
              <Text style={styles.toggleBtText}>{btConnected ? 'Desconectar' : 'Conectar'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleScanBluetooth}
            disabled={btScanning}
          >
            {btScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanBtnText}>🔍 Escanear Dispositivos Cerca</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { padding: 20, paddingTop: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  logo: { width: 45, height: 45, marginRight: 10 },
  logoText: { fontSize: 32, marginRight: 10 },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: '#e3f2fd', fontSize: 13, marginBottom: 15 },
  authActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  loginBtn: { flex: 1, backgroundColor: '#ffffff', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginRight: 8, elevation: 2 },
  loginBtnText: { color: '#1E88E5', fontWeight: 'bold', fontSize: 13 },
  registerBtn: { flex: 1, backgroundColor: '#00ACC1', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginLeft: 8, elevation: 2 },
  registerBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  body: { padding: 18 },
  sectionHeader: { marginTop: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  sectionSub: { fontSize: 12, color: '#666' },
  ecgCard: { backgroundColor: '#ffffff', padding: 18, borderRadius: 16, marginBottom: 15, elevation: 2 },
  ecgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecgTitle: { fontSize: 14, fontWeight: 'bold', color: '#444' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  bpmRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 12 },
  bpmValue: { fontSize: 48, fontWeight: 'bold', color: '#e53935' },
  bpmUnit: { fontSize: 18, fontWeight: 'bold', color: '#555', marginLeft: 6, marginRight: 20 },
  ecgWave: { fontSize: 18, color: '#e53935' },
  bpmStatus: { fontSize: 12, color: '#2e7d32', fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  smallMetricCard: { width: '48%', backgroundColor: '#ffffff', padding: 16, borderRadius: 14, elevation: 2 },
  metricLabel: { fontSize: 13, color: '#666', fontWeight: 'bold' },
  metricVal: { fontSize: 26, fontWeight: 'bold', color: '#1E88E5', marginVertical: 6 },
  metricTag: { fontSize: 11, color: '#2e7d32', fontWeight: 'bold' },
  btCard: { backgroundColor: '#ffffff', padding: 18, borderRadius: 16, elevation: 2, marginBottom: 20 },
  btRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  btDeviceName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  btDeviceDetails: { fontSize: 11, color: '#666', marginTop: 3 },
  toggleBtBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  toggleBtText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  scanBtn: { backgroundColor: '#1E88E5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  scanBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
