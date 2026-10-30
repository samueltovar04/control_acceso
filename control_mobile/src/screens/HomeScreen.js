import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert, Dimensions } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import axios from 'axios';
import { getBrandingConfig } from '../services/brandingService';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

export const HomeScreen = ({ route, navigation }) => {
  const clienteId = route?.params?.clienteId;
  const [branding, setBranding] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Telemetry
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.7);

  // Dynamic Banking Accounts State
  const [bankingModalVisible, setBankingModalVisible] = useState(false);
  const [bancos, setBancos] = useState([]);
  const [loadingBancos, setLoadingBancos] = useState(false);

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));

    async function fetchClienteReal() {
      if (!clienteId) {
        setLoading(false);
        setCliente(null);
        Alert.alert(
          '🔒 Sesión Requerida',
          'Por favor inicie sesión con sus credenciales para acceder.',
          [{ text: 'Iniciar Sesión', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
        );
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 5000 });
        if (response.data && response.data.id) {
          if (response.data.sesionMovilActiva === false) {
            await AsyncStorage.multiRemove(['userToken', 'clienteId', 'userEmail', 'userDoc']);
            setCliente(null);
            Alert.alert(
              '🔒 Sesión Cerrada Remotamente',
              'Su sesión fue cerrada por el administrador desde el panel web. Por favor inicie sesión nuevamente.',
              [{ text: 'Ir a Iniciar Sesión', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
            );
            return;
          }
          setCliente(response.data);
        } else {
          throw new Error('Perfil de cliente no encontrado');
        }
      } catch (error) {
        console.warn('Error fetching real cliente:', error.message);
        setCliente(null);
      } finally {
        setLoading(false);
      }
    }

    fetchClienteReal();

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
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, [clienteId]);

  const fetchBancosBackend = async () => {
    setLoadingBancos(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/bancos`, { timeout: 5000 });
      setBancos(response.data || []);
    } catch (error) {
      console.warn('Sin respuesta de cuentas bancarias en servidor:', error.message);
      setBancos([]);
    } finally {
      setLoadingBancos(false);
    }
  };

  const handleOpenBankingModal = () => {
    fetchBancosBackend();
    setBankingModalVisible(true);
  };

  const getProfileAvatarSource = () => {
    if (cliente?.foto && (cliente.foto.startsWith('http') || cliente.foto.startsWith('data:image'))) {
      return { uri: cliente.foto };
    }
    return { uri: DEFAULT_AVATAR };
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Cerrar Sesión',
      '¿Está seguro de que desea salir de su cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (clienteId) {
                await axios.post(`${API_BASE_URL}/clientes/${clienteId}/cerrar-sesion-movil`, {}, { timeout: 4000 });
              }
            } catch (e) {}
            await AsyncStorage.multiRemove(['userToken', 'clienteId', 'userEmail', 'userDoc']);
            setCliente(null);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  if (loading && !cliente) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7043" />
        <Text style={styles.loadingText}>Cargando perfil Clean Health...</Text>
      </View>
    );
  }

  if (!cliente) return null;

  return (
    <View style={styles.outerWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* HEADER LIMPIO "HELLO, SAMUEL" CON AVATAR (CLON IMAGEN DE REFERENCIA 2) */}
        <View style={styles.cleanHeaderRow}>
          <View>
            <Text style={styles.greetingLight}>Hello,</Text>
            <Text style={styles.greetingName}>{cliente?.nombre || 'Samuel'}</Text>
          </View>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications', { clienteId })}>
              <MaterialIcon name="bell-outline" size={22} color="#ff7043" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
              <Image source={getProfileAvatarSource()} style={styles.topAvatar} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 1: GYM ACCESS CARD (NFC / QR TAP TO SCAN CON FONDO PEACH) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>GYM ACCESS</Text>
        </View>

        <TouchableOpacity
          style={styles.gymAccessCard}
          onPress={() => navigation.navigate('DigitalPass', { clienteId, clienteDocumento: cliente?.documento || '15650242' })}
        >
          <View style={styles.accessCardTopRow}>
            <Text style={styles.nfcScanLabel}>NFC TO SCAN</Text>
            <View style={styles.activePassBadge}>
              <Text style={styles.activePassText}>ACTIVE PASS</Text>
            </View>
          </View>

          <View style={styles.qrNfcBodyRow}>
            {/* CÓDIGO QR SIMULADO PEACH */}
            <View style={styles.qrCodeBox}>
              <MaterialIcon name="qrcode-scan" size={60} color="#ff7043" />
            </View>

            {/* ONDAS NFC Y TAP TO SCAN */}
            <View style={styles.nfcWaveBox}>
              <MaterialIcon name="nfc" size={36} color="#ff7043" />
              <Text style={styles.tapToScanText}>TAP TO SCAN</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* SECCIÓN 2: LIVE BIOMETRICS CARD (HEART RATE - LIVE PULSE ❤️) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LIVE BIOMETRICS</Text>
        </View>

        <TouchableOpacity
          style={styles.biometricsCard}
          onPress={() => navigation.navigate('VitalSigns', { clienteId })}
        >
          <View style={styles.biometricsTopRow}>
            <Text style={styles.biometricsLabel}>HEARTRATE</Text>
            <View style={styles.livePulseTag}>
              <Text style={styles.livePulseText}>Live Pulse</Text>
              <MaterialIcon name="heart-pulse" size={14} color="#ff7043" style={{ marginLeft: 3 }} />
            </View>
          </View>

          <Text style={styles.bpmValueText}>
            {bpm} <Text style={styles.bpmUnitText}>BPM</Text>
          </Text>

          {/* ONDA FLUIDA PEACH DE RITMO CARDÍACO */}
          <Svg height="60" width={width - 70} style={{ marginTop: 4 }}>
            <Defs>
              <LinearGradient id="peachWave" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ff7043" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#ffb74d" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>
            <Path d="M 0 40 Q 30 10 60 40 T 120 15 T 180 45 T 240 20 T 300 40 L 300 60 L 0 60 Z" fill="url(#peachWave)" />
            <Path d="M 0 40 Q 30 10 60 40 T 120 15 T 180 45 T 240 20 T 300 40" fill="none" stroke="#ff7043" strokeWidth="3" />
          </Svg>
        </TouchableOpacity>

        {/* SECCIÓN 3: FITNESS STATS CARDS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>FITNESS STATS</Text>
        </View>

        <View style={styles.fitnessStatsGrid}>
          {/* DAILY STEPS RADIAL RING */}
          <View style={[styles.fitnessCard, { flex: 1.1 }]}>
            <Text style={styles.fitnessLabelCenter}>DAILY STEPS</Text>
            <View style={styles.radialRingWrap}>
              <Svg viewBox="0 0 100 100" style={{ width: 80, height: 80, transform: [{ rotate: '-90deg' }] }}>
                <Circle cx="50" cy="50" r="38" fill="none" stroke="#ffe0b2" strokeWidth="8" />
                <Circle cx="50" cy="50" r="38" fill="none" stroke="#ff7043" strokeWidth="8" strokeDasharray="238.7" strokeDashoffset="40" strokeLinecap="round" />
              </Svg>
              <View style={styles.radialTextCenter}>
                <Text style={styles.stepNumText}>8,432</Text>
                <Text style={styles.stepGoalText}>/ 10,000</Text>
              </View>
            </View>
          </View>

          {/* CALORIES & WORKOUT TIME STACK */}
          <View style={{ flex: 1, gap: 10 }}>
            {/* CALORIES */}
            <View style={styles.fitnessCardSmall}>
              <View>
                <Text style={styles.fitnessLabelSmall}>CALORIES</Text>
                <Text style={styles.calorieValText}>450 <Text style={styles.calorieUnitText}>/ 600 kcal</Text></Text>
              </View>
              <MaterialIcon name="fire" size={24} color="#ff7043" />
            </View>

            {/* WORKOUT TIME */}
            <View style={styles.fitnessCardSmall}>
              <View>
                <Text style={styles.fitnessLabelSmall}>WORKOUT TIME</Text>
                <Text style={styles.calorieValText}>45 <Text style={styles.calorieUnitText}>mins</Text></Text>
              </View>
              <MaterialIcon name="play-circle" size={24} color="#ff7043" />
            </View>
          </View>
        </View>

        {/* ACCESO A PAGOS Y DATOS BANCARIOS */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <TouchableOpacity style={styles.subActionBtn} onPress={() => navigation.navigate('Payments', { clienteId })}>
            <MaterialIcon name="credit-card-outline" size={22} color="#ff7043" />
            <Text style={styles.subActionText}>Pagos y Cobros</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.subActionBtn} onPress={handleOpenBankingModal}>
            <MaterialIcon name="bank-outline" size={22} color="#ff7043" />
            <Text style={styles.subActionText}>Datos Bancarios</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* BOTÓN FLOTANTE PRINCIPAL "ACCESS" PEACH EN PARTE INFERIOR */}
      <View style={styles.bottomNavFloatingBar}>
        <TouchableOpacity style={styles.navTabIcon} onPress={() => {}}>
          <MaterialIcon name="home" size={24} color="#ff7043" />
          <Text style={styles.navTabTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTabIcon} onPress={() => navigation.navigate('VitalSigns', { clienteId })}>
          <MaterialIcon name="chart-bell-curve" size={24} color="#94a3b8" />
          <Text style={styles.navTabText}>Activity</Text>
        </TouchableOpacity>

        {/* FLOATING ACCESS PILL */}
        <TouchableOpacity
          style={styles.floatingAccessPill}
          onPress={() => navigation.navigate('DigitalPass', { clienteId, clienteDocumento: cliente?.documento || '15650242' })}
        >
          <Text style={styles.floatingAccessText}>Access</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTabIcon} onPress={() => navigation.navigate('VitalSigns', { clienteId })}>
          <MaterialIcon name="heart-pulse" size={24} color="#94a3b8" />
          <Text style={styles.navTabText}>Health</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTabIcon} onPress={handleLogout}>
          <MaterialIcon name="logout" size={24} color="#e57373" />
          <Text style={styles.navTabTextAlert}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { color: '#ff7043', fontWeight: 'bold', marginTop: 10 },

  // CLEAN HEADER
  cleanHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingLight: { fontSize: 20, color: '#94a3b8', fontWeight: '500' },
  greetingName: { fontSize: 26, fontWeight: '900', color: '#bf360c', marginTop: -4 },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff3e0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffe0b2' },
  topAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#ff7043' },

  // SECTIONS
  sectionHeader: { marginBottom: 8, marginTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#78350f', letterSpacing: 0.8 },

  // GYM ACCESS CARD
  gymAccessCard: { backgroundColor: '#ffffff', borderRadius: 22, padding: 16, borderWidth: 1.5, borderColor: '#ffe0b2', shadowColor: '#ff8a65', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4, marginBottom: 16 },
  accessCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nfcScanLabel: { fontSize: 13, fontWeight: '800', color: '#78350f' },
  activePassBadge: { backgroundColor: '#ffe0b2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activePassText: { fontSize: 10, fontWeight: '800', color: '#e65100' },
  qrNfcBodyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 10 },
  qrCodeBox: { backgroundColor: '#fff3e0', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ffe0b2' },
  nfcWaveBox: { alignItems: 'center', marginRight: 15 },
  tapToScanText: { fontSize: 10, fontWeight: '800', color: '#78350f', marginTop: 4, letterSpacing: 0.5 },

  // LIVE BIOMETRICS CARD
  biometricsCard: { backgroundColor: '#ffffff', borderRadius: 22, padding: 18, borderWidth: 1.5, borderColor: '#ffe0b2', shadowColor: '#ff8a65', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4, marginBottom: 16 },
  biometricsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  biometricsLabel: { fontSize: 12, fontWeight: '800', color: '#78350f' },
  livePulseTag: { flexDirection: 'row', alignItems: 'center' },
  livePulseText: { fontSize: 12, fontWeight: '700', color: '#ff7043' },
  bpmValueText: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  bpmUnitText: { fontSize: 16, fontWeight: '700', color: '#64748b' },

  // FITNESS STATS GRID
  fitnessStatsGrid: { flexDirection: 'row', gap: 12 },
  fitnessCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#ffe0b2', elevation: 2 },
  fitnessCardSmall: { backgroundColor: '#ffffff', borderRadius: 18, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#ffe0b2', elevation: 2 },
  fitnessLabelCenter: { fontSize: 11, fontWeight: '800', color: '#78350f', marginBottom: 8 },
  fitnessLabelSmall: { fontSize: 10, fontWeight: '800', color: '#78350f' },
  calorieValText: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  calorieUnitText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  radialRingWrap: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  radialTextCenter: { position: 'absolute', alignItems: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  stepGoalText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  // SUB ACTIONS
  subActionBtn: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#ffe0b2', elevation: 2 },
  subActionText: { fontSize: 12, fontWeight: '800', color: '#0f172a' },

  // FLOATING BOTTOM NAV
  bottomNavFloatingBar: { position: 'absolute', bottom: 15, left: 20, right: 20, backgroundColor: '#ffffff', height: 65, borderRadius: 32, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1.5, borderColor: '#ffe0b2', shadowColor: '#ff8a65', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  navTabIcon: { alignItems: 'center' },
  navTabText: { fontSize: 9, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  navTabTextActive: { fontSize: 9, color: '#ff7043', fontWeight: '800', marginTop: 2 },
  navTabTextAlert: { fontSize: 9, color: '#e57373', fontWeight: '800', marginTop: 2 },
  floatingAccessPill: { backgroundColor: '#ff7043', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20, shadowColor: '#ff7043', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  floatingAccessText: { color: '#ffffff', fontWeight: '800', fontSize: 14 }
});
