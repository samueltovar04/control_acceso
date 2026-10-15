import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const DigitalPassScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const initialDocumento = route?.params?.clienteDocumento || '';

  const [cliente, setCliente] = useState(null);
  const [documento, setDocumento] = useState(initialDocumento);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchClienteReal() {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 5000 });
        if (response.data) {
          setCliente(response.data);
          if (response.data.documento) {
            setDocumento(response.data.documento);
          }
        }
      } catch (error) {
        console.warn('Error fetching cliente profile for QR:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClienteReal();
  }, [clienteId]);

  const getStatusTextAndColor = () => {
    const estado = cliente?.estadoSuscripcion || 'MOROSO';
    if (estado === 'ACTIVA' || estado === 'AL_DIA' || estado === 'PAGADO') {
      return { label: 'PERMITIDO (Membresía Activa)', color: '#2e7d32' };
    }
    if (estado === 'PENDIENTE_CONCILIAR') {
      return { label: 'TEMPORAL (Acceso de Gracia en Revisión)', color: '#f57c00' };
    }
    return { label: 'DENEGADO (Pago Pendiente)', color: '#c62828' };
  };

  const statusInfo = getStatusTextAndColor();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pase Digital QR de Acceso</Text>
      <Text style={styles.subtitle}>Presente este código en los lectores ópticos de los torniquetes</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 30 }} />
      ) : (
        <View style={styles.qrContainer}>
          <QRCode value={documento || 'V-00000000'} size={230} />
        </View>
      )}

      <Text style={styles.tokenText}>
        Cédula / DNI Registrado: <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 18 }}>{documento || 'Sin Cédula'}</Text>
      </Text>

      <Text style={[styles.statusText, { color: statusInfo.color }]}>
        Estado: {statusInfo.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 25 },
  qrContainer: { padding: 20, backgroundColor: '#ffffff', borderRadius: 20, elevation: 5, marginBottom: 25, borderWidth: 1, borderColor: '#e0e0e0' },
  tokenText: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 8, textAlign: 'center' },
  statusText: { fontSize: 15, fontWeight: 'bold', marginTop: 12, textAlign: 'center' }
});
