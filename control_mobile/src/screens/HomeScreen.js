import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import axios from 'axios';
import { getBrandingConfig } from '../services/brandingService';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

export const HomeScreen = ({ route, navigation }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [branding, setBranding] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dynamic Banking Accounts State from Backend API
  const [bankingModalVisible, setBankingModalVisible] = useState(false);
  const [bancos, setBancos] = useState([]);
  const [loadingBancos, setLoadingBancos] = useState(false);

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));

    async function fetchClienteReal() {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 5000 });
        setCliente(response.data);
      } catch (error) {
        console.warn('Error fetching real cliente:', error.message);
        // Fallback default
        setCliente({
          id: clienteId,
          nombre: 'Carlos',
          apellido: 'Pérez',
          documento: 'V-18234567',
          estadoSuscripcion: 'ACTIVA',
          foto: ''
        });
      } finally {
        setLoading(false);
      }
    }

    fetchClienteReal();
  }, [clienteId]);

  const fetchBancosBackend = async () => {
    setLoadingBancos(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/bancos`, { timeout: 5000 });
      setBancos(response.data || []);
    } catch (error) {
      console.warn('Sin respuesta de cuentas bancarias en servidor:', error.message);
      setBancos([]); // Strictly NO hardcoded fallback data
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

  const handleCopyAccountData = (b) => {
    let details = `Plataforma / Banco: ${b.nombre}\n`;
    if (b.tipo) details += `Tipo: ${b.tipo}\n`;
    if (b.email) details += `Correo: ${b.email}\n`;
    if (b.direccionBilletera) details += `ID / Billetera: ${b.direccionBilletera}\n`;
    if (b.red) details += `Red: ${b.red}\n`;
    if (b.memoQr) details += `Memo / Tag: ${b.memoQr}\n`;
    if (b.documentoTitular) details += `RIF / Doc: ${b.documentoTitular}\n`;
    if (b.telefono) details += `Teléfono: ${b.telefono}\n`;
    if (b.titular) details += `Titular: ${b.titular}\n`;
    if (b.numeroCuenta) details += `Número de Cuenta: ${b.numeroCuenta}\n`;
    if (b.notasInstruccion) details += `Instrucciones: ${b.notasInstruccion}\n`;

    Clipboard.setString(details.trim());
    Alert.alert('¡Datos Copiados!', `Información de ${b.nombre} copiada al portapapeles.`);
  };

  const getAccountIcon = (tipo) => {
    const t = tipo ? tipo.toUpperCase() : '';
    if (t.includes('ZELLE')) return '💵';
    if (t.includes('BINANCE') || t.includes('CRIPTO') || t.includes('CRYPTO')) return '🪙';
    return '🏦';
  };

  return (
    <ScrollView style={styles.container}>
      {/* CABECERA CON LOGO Y BOTON CAMPANITA DE NOTIFICACIONES */}
      <View style={[styles.header, { backgroundColor: branding?.colorPrimary || '#1E88E5' }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {branding?.logoMenuUrl && (
              <Image source={{ uri: branding.logoMenuUrl }} style={styles.logoMenu} resizeMode="contain" />
            )}
            <Text style={styles.headerTitle}>{branding?.nombreEmpresa || 'Menú Principal'}</Text>
          </View>

          {/* CAMPANITA DE NOTIFICACIONES EN CABECERA */}
          <TouchableOpacity
            style={styles.headerNotificationBell}
            onPress={() => navigation.navigate('Notifications', { clienteId })}
          >
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 20 }} />
        ) : (
          /* TARJETA DE PERFIL CON FOTO REAL DEL CLIENTE O AVATAR */
          <View style={styles.profileCard}>
            <Image source={getProfileAvatarSource()} style={styles.profileAvatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.welcomeText}>
                ¡Hola, {cliente?.nombre || 'Cliente'} {cliente?.apellido || ''}!
              </Text>
              <Text style={styles.subText}>
                Cédula / DNI: <Text style={{ fontWeight: 'bold', color: '#1E88E5' }}>{cliente?.documento || 'V-18234567'}</Text>
              </Text>
              <Text style={styles.subText}>
                Membresía: <Text style={{ color: '#2e7d32', fontWeight: 'bold' }}>{cliente?.estadoSuscripcion || 'ACTIVA'}</Text>
              </Text>
            </View>
          </View>
        )}

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DigitalPass', { clienteId, clienteDocumento: cliente?.documento || 'V-18234567' })}
          >
            <Text style={styles.cardIcon}>🎟️</Text>
            <Text style={styles.cardTitle}>Pase Digital QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Payments', { clienteId })}
          >
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Pagos y Cobros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VitalSigns', { clienteId })}
          >
            <Text style={styles.cardIcon}>❤️</Text>
            <Text style={styles.cardTitle}>Signos Vitales</Text>
          </TouchableOpacity>

          {/* TARJETA DE DATOS BANCARIOS DESDE API BACKEND */}
          <TouchableOpacity
            style={styles.card}
            onPress={handleOpenBankingModal}
          >
            <Text style={styles.cardIcon}>🏦</Text>
            <Text style={styles.cardTitle}>Datos Bancarios</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE DATOS BANCARIOS DINÁMICOS DESDE API QUARKUS */}
      <Modal visible={bankingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>🏦 Cuentas Receptores Registradas en Servidor</Text>

            {loadingBancos ? (
              <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 20 }} />
            ) : bancos.length > 0 ? (
              bancos.map((b, idx) => (
                <View key={b.id ? b.id.toString() : idx.toString()} style={styles.bankAccountItem}>
                  <Text style={styles.bankName}>{getAccountIcon(b.tipo)} {b.nombre} {b.codigo ? `(${b.codigo})` : ''}</Text>

                  {b.email ? <Text style={styles.bankingText}>• Correo: <Text style={styles.boldVal}>{b.email}</Text></Text> : null}
                  {b.direccionBilletera ? <Text style={styles.bankingText}>• ID Binance Pay / Billetera: <Text style={styles.boldVal}>{b.direccionBilletera}</Text></Text> : null}
                  {b.red ? <Text style={styles.bankingText}>• Red Cripto: <Text style={styles.boldVal}>{b.red}</Text></Text> : null}
                  {b.memoQr ? <Text style={styles.bankingText}>• Memo / Tag: <Text style={styles.boldVal}>{b.memoQr}</Text></Text> : null}
                  {b.documentoTitular ? <Text style={styles.bankingText}>• RIF / Cédula: <Text style={styles.boldVal}>{b.documentoTitular}</Text></Text> : null}
                  {b.telefono ? <Text style={styles.bankingText}>• Teléfono: <Text style={styles.boldVal}>{b.telefono}</Text></Text> : null}
                  {b.titular ? <Text style={styles.bankingText}>• Titular: <Text style={styles.boldVal}>{b.titular}</Text></Text> : null}
                  {b.numeroCuenta ? <Text style={styles.bankingText}>• Cuenta: <Text style={styles.boldVal}>{b.numeroCuenta}</Text></Text> : null}
                  {b.notasInstruccion ? <Text style={styles.instructionText}>💡 {b.notasInstruccion}</Text> : null}

                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyAccountData(b)}>
                    <Text style={styles.copyBtnText}>📋 Copiar Datos de {b.nombre}</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              /* AVISO DE CERO DATOS HARDCODEADOS */
              <View style={styles.emptyBankContainer}>
                <Text style={styles.emptyBankIcon}>⚠️</Text>
                <Text style={styles.emptyBankText}>
                  No existen cuentas bancarias, Zelle o Binance Pay configurados en el servidor Quarkus.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setBankingModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 40, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  logoMenu: { width: 80, height: 80, marginBottom: 6 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  headerNotificationBell: { position: 'absolute', right: 5, top: 5, backgroundColor: 'rgba(255,255,255,0.25)', padding: 10, borderRadius: 20 },
  body: { padding: 18 },
  profileCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20, elevation: 3, borderWidth: 1, borderColor: '#e0e0e0' },
  profileAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#1E88E5', backgroundColor: '#e0e0e0' },
  profileInfo: { flex: 1, marginLeft: 14 },
  welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  subText: { fontSize: 13, color: '#555', marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 15, elevation: 2 },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E88E5', marginBottom: 14, textAlign: 'center' },
  bankAccountItem: { backgroundColor: '#f8f9fa', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  bankName: { fontSize: 15, fontWeight: 'bold', color: '#00ACC1', marginBottom: 8 },
  bankingText: { fontSize: 13, color: '#444444', marginVertical: 2 },
  boldVal: { fontWeight: 'bold', color: '#111111' },
  instructionText: { fontSize: 12, color: '#f57c00', fontStyle: 'italic', marginTop: 6 },
  emptyBankContainer: { alignItems: 'center', marginVertical: 25, paddingHorizontal: 15 },
  emptyBankIcon: { fontSize: 32, marginBottom: 8 },
  emptyBankText: { fontSize: 13, color: '#c62828', textAlign: 'center', fontWeight: 'bold', lineHeight: 18 },
  copyBtn: { backgroundColor: '#e0f7fa', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  copyBtnText: { color: '#00838f', fontWeight: 'bold', fontSize: 12 },
  closeModalBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  closeModalBtnText: { color: '#757575', fontWeight: 'bold' }
});
