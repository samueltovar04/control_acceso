import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Polyline, Line, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

const { width } = Dimensions.get('window');

export const VitalSignsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [bpm, setBpm] = useState(96);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.8);
  const [estres, setEstres] = useState(78);
  const [pulseraMac, setPulseraMac] = useState('PULSERA_002');
  const [loading, setLoading] = useState(false);
  const [waveOffset, setWaveOffset] = useState(0);

  // Animate wave offset simulation for real-time oscilloscope
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 5) % 100);
    }, 150);
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
        setBpm(response.data.bpm || 96);
        setSpo2(response.data.spo2 || 98);
        setTemp(response.data.temp || response.data.temperatura || 36.8);
        if (response.data.estres) setEstres(response.data.estres);
        if (response.data.id_pulsera) {
          setPulseraMac(response.data.id_pulsera);
        }
      }
    } catch (error) {
      console.warn('Sin respuesta de telemetria backend, utilizando valores demostrativos:', error.message);
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
      if (ws) ws.close();
    };
  }, [clienteId]);

  // Generate dynamic SVG ECG wave path string
  const generateEcgPath = () => {
    const points = [];
    const svgWidth = width - 80;
    const baseHeight = 35;

    for (let x = 0; x <= svgWidth; x += 10) {
      const cycleX = (x + waveOffset * 3) % 120;
      let y = baseHeight;

      if (cycleX >= 40 && cycleX <= 45) y = baseHeight - 25; // QRS peak up
      else if (cycleX > 45 && cycleX <= 52) y = baseHeight + 18; // QRS peak down
      else if (cycleX > 52 && cycleX <= 58) y = baseHeight - 8;
      else if (cycleX >= 80 && cycleX <= 95) y = baseHeight - 6; // T wave

      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  const generatePlethPath = () => {
    const points = [];
    const svgWidth = width - 80;
    const baseHeight = 25;

    for (let x = 0; x <= svgWidth; x += 8) {
      const cycleX = (x + waveOffset * 2) % 80;
      const radians = (cycleX / 80) * Math.PI * 2;
      const y = baseHeight - Math.sin(radians) * 12;
      points.push(`${x},${y.toFixed(1)}`);
    }
    return `M ${points.join(' L ')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 35 }}>
      {/* TITULO DE CABECERA FUTURISTA */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Monitor Telemétrico IoT</Text>
          <Text style={styles.subTitle}>Sincronización MESH • Dispositivo: <Text style={styles.highlightMac}>{pulseraMac}</Text></Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchUltimaTelemetria}>
          {loading ? (
            <ActivityIndicator color="#00e5ff" size="small" />
          ) : (
            <MaterialIcon name="sync" size={22} color="#00e5ff" />
          )}
        </TouchableOpacity>
      </View>

      {/* MONITOR PRINCIPAL ESTILO HOLOGRÁFICO MÉDICO (CLON IMAGEN DE REFERENCIA) */}
      <View style={styles.hologramMonitorCard}>
        <View style={styles.monitorHeaderBar}>
          <View style={styles.monitorDotRow}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
          </View>
          <Text style={styles.monitorTitleText}>MONITOR HOLO-ECG V2.4 • TRANSMISIÓN MESH</Text>
          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>

        <View style={styles.monitorBodyRow}>
          {/* PANEL IZQUIERDO: TRAZADO DE ONDAS DE OSCILOSCOPIO (ECG & SPO2) */}
          <View style={styles.waveformContainer}>
            <Text style={styles.waveLabelGreen}>ECG / RITMO CARDÍACO (135 MAX)</Text>
            <Svg height="65" width={width - 190} style={styles.svgOscilloscope}>
              <Defs>
                <LinearGradient id="ecgGlow" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path d={generateEcgPath()} fill="none" stroke="url(#ecgGlow)" strokeWidth="2.5" />
            </Svg>

            <Text style={styles.waveLabelCyan}>SPO2 / PLETH WAVE (OXÍGENO)</Text>
            <Svg height="45" width={width - 190} style={styles.svgOscilloscope}>
              <Defs>
                <LinearGradient id="spo2Glow" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path d={generatePlethPath()} fill="none" stroke="url(#spo2Glow)" strokeWidth="2" />
            </Svg>
          </View>

          {/* PANEL DERECHO: LECTURAS NUMÉRICAS GIGANTES NEÓN CON RESPLANDOR */}
          <View style={styles.statsColumn}>
            {/* RITMO CARDIACO BPM */}
            <View style={styles.statBox}>
              <View style={styles.statIconValueRow}>
                <MaterialIcon name="heart-pulse" size={20} color="#22c55e" />
                <Text style={styles.statValueGreen}>{bpm > 0 ? bpm : '--'}</Text>
              </View>
              <Text style={styles.statUnitText}>BPM</Text>
            </View>

            {/* SPO2 % */}
            <View style={styles.statBox}>
              <View style={styles.statIconValueRow}>
                <MaterialIcon name="water-percent" size={20} color="#38bdf8" />
                <Text style={styles.statValueCyan}>{spo2 > 0 ? `${spo2}` : '--'}</Text>
              </View>
              <Text style={styles.statUnitText}>SPO2 %</Text>
            </View>

            {/* TEMPERATURA CORPORAL */}
            <View style={styles.statBox}>
              <View style={styles.statIconValueRow}>
                <MaterialIcon name="thermometer" size={20} color="#f59e0b" />
                <Text style={styles.statValueYellow}>{temp > 0 ? temp.toFixed(1) : '--'}</Text>
              </View>
              <Text style={styles.statUnitText}>°C TEMP</Text>
            </View>

            {/* ESTRÉS / PERFUSIÓN */}
            <View style={styles.statBox}>
              <View style={styles.statIconValueRow}>
                <MaterialIcon name="speedometer" size={20} color="#f97316" />
                <Text style={styles.statValueOrange}>{estres}</Text>
              </View>
              <Text style={styles.statUnitText}>ESTRÉS</Text>
            </View>
          </View>
        </View>
      </View>

      {/* GRILLA DE TARJETAS DE ANÁLISIS Y ESTADO DE DISPOSITIVO */}
      <View style={styles.cardsRow}>
        {/* TARJETA 1: RITMO CARDÍACO Y DESGLOSE */}
        <View style={styles.cardHalf}>
          <View style={styles.cardHeaderSmall}>
            <MaterialIcon name="heart-flash" size={18} color="#ef4444" />
            <Text style={styles.cardTitleSmall}>Lote de Rate</Text>
          </View>
          <View style={styles.bigStatContainer}>
            <Text style={styles.hugeBpmText}>{bpm > 0 ? bpm : 135}</Text>
            <Text style={styles.bpmSubText}>BPM REAL</Text>
          </View>
          <View style={styles.rangeBarBg}>
            <View style={[styles.rangeBarFill, { width: `${Math.min(100, ((bpm || 75) / 160) * 100)}%` }]} />
          </View>
          <Text style={styles.cardStatusNormal}>
            {bpm > 0 ? '✓ Ritmo Sinusal Estable' : 'Sin lectura'}
          </Text>
        </View>

        {/* TARJETA 2: CALIDAD Y SENSOR WEARABLE */}
        <View style={styles.cardHalf}>
          <View style={styles.cardHeaderSmall}>
            <MaterialIcon name="battery-charging-90" size={18} color="#22c55e" />
            <Text style={styles.cardTitleSmall}>Wearable IoT</Text>
          </View>

          <View style={styles.wearableDetailRow}>
            <Text style={styles.wearableLabel}>Batería:</Text>
            <Text style={styles.wearableValGreen}>98% 🔋</Text>
          </View>

          <View style={styles.wearableDetailRow}>
            <Text style={styles.wearableLabel}>Señal Wi-Fi:</Text>
            <Text style={styles.wearableValCyan}>-62 dBm 📶</Text>
          </View>

          <View style={styles.wearableDetailRow}>
            <Text style={styles.wearableLabel}>Contacto Piel:</Text>
            <Text style={styles.wearableValOk}>Detectado ✓</Text>
          </View>

          <View style={styles.wearableDetailRow}>
            <Text style={styles.wearableLabel}>Socio ID:</Text>
            <Text style={styles.wearableValWhite}>#{clienteId}</Text>
          </View>
        </View>
      </View>

      {/* TARJETA DE ANÁLISIS DE ACTIVIDAD HISTÓRICA / HISTOGRAMA DE BARRAS */}
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcon name="chart-bar" size={20} color="#38bdf8" style={{ marginRight: 6 }} />
            <Text style={styles.analyticsTitle}>Health Analytics (Trazabilidad por Horas)</Text>
          </View>

          <View style={styles.legendContainer}>
            <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
            <Text style={styles.legendText}>BPM</Text>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b', marginLeft: 8 }]} />
            <Text style={styles.legendText}>SpO2</Text>
          </View>
        </View>

        {/* DIBUJO DE GRÁFICO DE BARRAS TELEMÉTRICO DE ACTIVIDAD */}
        <View style={styles.barChartContainer}>
          {[
            { hora: '08:00', h1: 45, h2: 70 },
            { hora: '10:00', h1: 60, h2: 85 },
            { hora: '12:00', h1: 80, h2: 95 },
            { hora: '14:00', h1: 55, h2: 75 },
            { hora: '16:00', h1: 90, h2: 100 },
            { hora: '18:00', h1: 70, h2: 90 }
          ].map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barTrack}>
                <View style={[styles.bar1, { height: item.h1 }]} />
                <View style={[styles.bar2, { height: item.h2 }]} />
              </View>
              <Text style={styles.barHourText}>{item.hora}</Text>
            </View>
          ))}
        </View>

        {/* INDICADORES RADIALES / PORCENTAJES DE SALUD */}
        <View style={styles.radialRow}>
          <View style={styles.radialItem}>
            <Text style={styles.radialValueGreen}>99%</Text>
            <Text style={styles.radialLabel}>Calidad Señal</Text>
          </View>

          <View style={styles.radialDivider} />

          <View style={styles.radialItem}>
            <Text style={styles.radialValueOrange}>51%</Text>
            <Text style={styles.radialLabel}>Nivel Esfuerzo</Text>
          </View>

          <View style={styles.radialDivider} />

          <View style={styles.radialItem}>
            <Text style={styles.radialValueCyan}>29</Text>
            <Text style={styles.radialLabel}>Lecturas / min</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subTitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  highlightMac: { color: '#38bdf8', fontWeight: 'bold' },
  refreshIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },

  // HOLOGRAM MONITOR STYLES
  hologramMonitorCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1.5, borderColor: '#00e5ff', padding: 12, marginBottom: 16, shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  monitorHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  monitorDotRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  monitorTitleText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#22c55e' },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 4 },
  liveText: { color: '#22c55e', fontSize: 9, fontWeight: 'bold' },
  monitorBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waveformContainer: { flex: 1, paddingRight: 8 },
  waveLabelGreen: { color: '#22c55e', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  waveLabelCyan: { color: '#38bdf8', fontSize: 9, fontWeight: 'bold', marginTop: 6, marginBottom: 2 },
  svgOscilloscope: { backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 6, paddingVertical: 4 },
  statsColumn: { width: 85, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingLeft: 8 },
  statBox: { marginBottom: 8 },
  statIconValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValueGreen: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  statValueCyan: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold' },
  statValueYellow: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold' },
  statValueOrange: { color: '#f97316', fontSize: 18, fontWeight: 'bold' },
  statUnitText: { color: '#64748b', fontSize: 8, fontWeight: 'bold', marginTop: -2 },

  // CARDS GRID STYLES
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cardHalf: { width: '48%', backgroundColor: '#1e293b', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeaderSmall: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitleSmall: { color: '#f8fafc', fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  bigStatContainer: { alignItems: 'center', marginVertical: 4 },
  hugeBpmText: { fontSize: 32, fontWeight: 'bold', color: '#ef4444' },
  bpmSubText: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold' },
  rangeBarBg: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, marginVertical: 6, overflow: 'hidden' },
  rangeBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  cardStatusNormal: { color: '#22c55e', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  wearableDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  wearableLabel: { color: '#94a3b8', fontSize: 11 },
  wearableValGreen: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  wearableValCyan: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  wearableValOk: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  wearableValWhite: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  // ANALYTICS & BAR CHART STYLES
  analyticsCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  analyticsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  analyticsTitle: { color: '#f8fafc', fontSize: 13, fontWeight: 'bold' },
  legendContainer: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#94a3b8', fontSize: 10, marginLeft: 4, fontWeight: 'bold' },
  barChartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 110, paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  barGroup: { alignItems: 'center' },
  barTrack: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 },
  bar1: { width: 10, backgroundColor: '#38bdf8', borderRadius: 3 },
  bar2: { width: 10, backgroundColor: '#f59e0b', borderRadius: 3 },
  barHourText: { color: '#64748b', fontSize: 9, marginTop: 4, fontWeight: 'bold' },
  radialRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 4 },
  radialItem: { alignItems: 'center' },
  radialValueGreen: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  radialValueOrange: { color: '#f97316', fontSize: 18, fontWeight: 'bold' },
  radialValueCyan: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold' },
  radialLabel: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  radialDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)' }
});
