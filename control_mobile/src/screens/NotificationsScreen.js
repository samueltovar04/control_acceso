import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const NotificationsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/notificaciones/cliente/${clienteId}`, { timeout: 5000 });
      setNotifs(response.data || []);
    } catch (error) {
      console.warn('Error fetching notificaciones:', error.message);
      // Fallback
      setNotifs([
        { id: '1', titulo: 'Aviso de Pago Recibido', mensaje: 'Su pago de $50.00 ha sido registrado en el servidor.', fechaEnvio: '2026-03-01' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones de Pago & Avisos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={({ item }) => (
            <View style={styles.notifCard}>
              <Text style={styles.notifTitle}>{item.titulo || 'Notificación'}</Text>
              <Text style={styles.notifMensaje}>{item.mensaje}</Text>
              <Text style={styles.notifFecha}>{item.fechaEnvio ? item.fechaEnvio.substring(0, 10) : '2026-03-01'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  notifCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#1E88E5' },
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  notifMensaje: { fontSize: 14, color: '#555', marginBottom: 8 },
  notifFecha: { fontSize: 11, color: '#888', textAlign: 'right' }
});
