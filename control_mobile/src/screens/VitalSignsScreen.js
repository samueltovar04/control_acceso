import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import axios from 'axios';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

const { width } = Dimensions.get('window');

// Native Vector SVG Icons
const WaterIcon = ({ size = 22, color = '#0288d1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" fill={color} opacity={0.2} />
    <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ThermometerIcon = ({ size = 22, color = '#f57c00' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" fill={color} opacity={0.2} />
    <Path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SpeedometerIcon = ({ size = 22, color = '#388e3c' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 4a8 8 0 00-8 8c0 2.21.89 4.21 2.34 5.66" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 4a8 8 0 110 16 8 8 0 010-16z" stroke={color} strokeWidth="2" />
    <Path d="M12 12l3.5-3.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const BatteryIcon = ({ size = 22, color = '#7b1fa2' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="16" height="10" rx="2" fill={color} opacity={0.2} />
    <Rect x="2" y="7" width="16" height="10" rx="2" stroke={color} strokeWidth="2" />
    <Path d="M20 10v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Rect x="5" y="10" width="10" height="4" rx="1" fill={color} />
  </Svg>
);

const RefreshIcon = ({ size = 22, color = '#ff7043' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 4v6h-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const VitalSignsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.7);
  const [estres, setEstres] = useState(24);
  const [bateria, setBateria] = useState(98);
  const [pisoUbicacion, setPisoUbicacion] = useState('Piso 2');
  const [sedeUbicacion, setSedeUbicacion] = useState('Sede San Diego');
  const [gatewayNombre, setGatewayNombre] = useState('GW-MESH-01 (192.168.1.105)');
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

  const parseAndSetData = (data) => {
    if (!data) return;
    if (data.bpm !== undefined && data.bpm !== null) setBpm(Number(data.bpm));
    if (data.spo2 !== undefined && data.spo2 !== null) setSpo2(Number(data.spo2));
    if (data.temp !== undefined) setTemp(Number(data.temp));
    else if (data.temperatura !== undefined) setTemp(Number(data.temperatura));
    if (data.estres !== undefined) setEstres(Number(data.estres));
    if (data.bateria !== undefined && data.bateria !== null) setBateria(Number(data.bateria));
    if (data.piso_numero) setPisoUbicacion(data.piso_numero);
    if (data.sede_nombre) setSedeUbicacion(data.sede_nombre);
    if (data.gateway_id || data.gateway_ip) {
      const gwId = data.gateway_id || 'GW-MESH-01';
      const gwIp = data.gateway_ip ? ` (${data.gateway_ip})` : '';
      setGatewayNombre(`${gwId}${gwIp}`);
    }
    if (data.id_pulsera) setPulseraMac(data.id_pulsera);
  };

  const fetchUltimaTelemetria = async () => {
    setLoading(true);
    try {
      try {
        const clientRes = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 3000 });
        if (clientRes.data && clientRes.data.codigoInsignia) {
          const code = clientRes.data.codigoInsignia.trim().toUpperCase();
          setPulseraMac(code.startsWith('PULSERA') ? code : `PULSERA_${code}`);
        }
      } catch (e) {}

      const response = await axios.get(`${API_BASE_URL}/telemetria/cliente/${clienteId}/ultimo`, { timeout: 5000 });
      if (response.data) {
        parseAndSetData(response.data);
      }
    } catch (error) {
      console.warn('Obteniendo lecturas telemétricas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimaTelemetria();

    let ws = null;
    let isMounted = true;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(`${WS_BASE_URL}/signos-vitales`);

        ws.onopen = () => {
          console.log('WebSocket Telemetría conectado exitosamente');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            parseAndSetData(data);
          } catch (e) {
            console.warn('Error parseando mensaje WebSocket:', e.message);
          }
        };

        ws.onerror = (err) => {
          console.warn('Error WebSocket Telemetría:', err.message);
        };

        ws.onclose = () => {
          if (isMounted) {
            setTimeout(connectWebSocket, 3000);
          }
        };
      } catch (e) {
        console.warn('Excepción inicializando WebSocket:', e.message);
      }
    };

    connectWebSocket();

    const pollingInterval = setInterval(() => {
      fetchUltimaTelemetria();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
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
            <RefreshIcon size={22} color="#ff7043" />
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

      {/* TARJETA DE UBICACIÓN DENTRO DE SEDE Y GATEWAY MESH */}
      <View style={styles.locationGatewayCard}>
        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>UBICACIÓN DENTRO DE SEDE</Text>
            <Text style={styles.locationValue}>{sedeUbicacion} • {pisoUbicacion}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.locationLabel}>GATEWAY MESH</Text>
            <Text style={styles.gatewayValue}>● {gatewayNombre}</Text>
          </View>
        </View>
      </View>

      {/* GRILLA DE METRICAS PRINCIPALES */}
      <View style={styles.cardsGrid}>

        {/* SPO2 */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Saturación SpO2</Text>
            <WaterIcon size={22} color="#0288d1" />
          </View>
          <Text style={styles.metricNumBlue}>{spo2}%</Text>
          <Text style={styles.subStatusText}>Arterial Óptimo</Text>
        </View>

        {/* TEMPERATURA */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Temperatura</Text>
            <ThermometerIcon size={22} color="#f57c00" />
          </View>
          <Text style={styles.metricNumOrange}>{typeof temp === 'number' ? temp.toFixed(1) : temp}°C</Text>
          <Text style={styles.subStatusText}>Corporal Directa</Text>
        </View>

        {/* ESTRÉS / PERFUSIÓN */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Estrés / Carga</Text>
            <SpeedometerIcon size={22} color="#388e3c" />
          </View>
          <Text style={styles.metricNumGreen}>{estres}%</Text>
          <Text style={styles.subStatusText}>Nivel Normal</Text>
        </View>

        {/* ESTADO BATERÍA REAL DEL BRAZALETE */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Brazalete MESH</Text>
            <BatteryIcon size={22} color="#7b1fa2" />
          </View>
          <Text style={styles.metricNumPurple}>{bateria}%</Text>
          <Text style={styles.subStatusText}>Nivel Batería Real</Text>
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
  cleanMonitorCard: { backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1.5, borderColor: '#ffe0b2', padding: 16, marginBottom: 12, elevation: 4 },
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

  // LOCATION & GATEWAY CARD
  locationGatewayCard: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1.5, borderColor: '#ffe0b2', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, elevation: 2 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationLabel: { color: '#78350f', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  locationValue: { color: '#0f172a', fontSize: 12.5, fontWeight: '900' },
  gatewayValue: { color: '#2e7d32', fontSize: 12, fontWeight: '800' },

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
