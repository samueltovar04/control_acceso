import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const PaymentsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Modal form fields
  const [monto, setMonto] = useState('50.00');
  const [celular, setCelular] = useState('04121234567');
  const [banco, setBanco] = useState('Banesco');
  const [cedula, setCedula] = useState('V-18234567');
  const [fechaPago, setFechaPago] = useState('2026-03-01');
  const [numeroReferencia, setNumeroReferencia] = useState('882193');
  const [submitting, setSubmitting] = useState(false);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/finanzas/pagos`, { timeout: 5000 });
      setPagos(response.data || []);
    } catch (error) {
      console.warn('Error fetching pagos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);

  const handleSubmitPaymentNotification = async () => {
    if (!monto || !celular || !banco || !cedula || !numeroReferencia) {
      Alert.alert('Campos Incompletos', 'Por favor complete todos los datos del pago.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        clienteId: clienteId,
        monto: parseFloat(monto),
        celular: celular,
        banco: banco,
        cedula: cedula,
        fechaPago: fechaPago,
        numeroReferencia: numeroReferencia
      };

      await axios.post(`${API_BASE_URL}/finanzas/notificacion-pago`, payload, { timeout: 5000 });

      setSubmitting(false);
      setModalVisible(false);
      Alert.alert('Reporte Enviado', 'Su notificación de pago ha sido registrada exitosamente para conciliación bancaria.');
      fetchPagos();
    } catch (error) {
      setSubmitting(false);
      const errMsg = error.response?.data?.error || error.message;
      Alert.alert('Error al Reportar Pago', errMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Pagos & Notificaciones</Text>

      <View style={styles.cardInfo}>
        <Text style={styles.cardLabel}>Membresía Mensual Pro</Text>
        <Text style={styles.cardAmount}>$50.00 / mes</Text>
        <Text style={styles.cardExpiry}>Estado: AL DÍA EN SERVIDOR</Text>
      </View>

      <TouchableOpacity style={styles.payButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.payButtonText}>💳 Reportar Notificación de Pago</Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>Historial de Pagos en Servidor</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          data={pagos}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={({ item }) => (
            <View style={styles.pagoItem}>
              <View>
                <Text style={styles.pagoFecha}>{item.fechaPago ? item.fechaPago.substring(0, 10) : '2026-03-01'} - {item.metodoPago || 'TRANSFERENCIA'}</Text>
                <Text style={styles.pagoEstado}>{item.estadoPago || 'COMPLETADO'}</Text>
              </View>
              <Text style={styles.pagoMonto}>${item.monto || '50.00'}</Text>
            </View>
          )}
        />
      )}

      {/* MODAL DE NOTIFICACION DE PAGO COMPLETO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Reportar Notificación de Pago</Text>

            <Text style={styles.fieldLabel}>Monto ($ / Bs)</Text>
            <TextInput style={styles.modalInput} value={monto} onChangeText={setMonto} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Celular Emisor</Text>
            <TextInput style={styles.modalInput} value={celular} onChangeText={setCelular} keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>Banco Origen / Destino</Text>
            <TextInput style={styles.modalInput} value={banco} onChangeText={setBanco} />

            <Text style={styles.fieldLabel}>Cédula / DNI</Text>
            <TextInput style={styles.modalInput} value={cedula} onChangeText={setCedula} />

            <Text style={styles.fieldLabel}>Fecha de Pago</Text>
            <TextInput style={styles.modalInput} value={fechaPago} onChangeText={setFechaPago} />

            <Text style={styles.fieldLabel}>Número de Referencia</Text>
            <TextInput style={styles.modalInput} value={numeroReferencia} onChangeText={setNumeroReferencia} />

            <TouchableOpacity style={styles.submitModalBtn} onPress={handleSubmitPaymentNotification} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitModalText}>Enviar Reporte a Servidor</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  cardInfo: { backgroundColor: '#1E88E5', padding: 20, borderRadius: 12, marginBottom: 15 },
  cardLabel: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  cardAmount: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  cardExpiry: { color: '#e0e0e0', fontSize: 12 },
  payButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  payButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  pagoItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pagoFecha: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  pagoEstado: { fontSize: 11, color: '#2e7d32', fontWeight: 'bold' },
  pagoMonto: { fontSize: 16, fontWeight: 'bold', color: '#1E88E5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E88E5', marginBottom: 15 },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 42, marginBottom: 12, fontSize: 14 },
  submitModalBtn: { backgroundColor: '#2e7d32', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitModalText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelModalBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelModalText: { color: '#888', fontWeight: 'bold' }
});
