import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const NotificationsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/notificaciones/cliente/${clienteId}`, { timeout: 5000 });
      setNotifs(response.data || []);
    } catch (error) {
      console.warn('Sin notificaciones en servidor Quarkus:', error.message);
      setNotifs([]); // Strictly NO hardcoded fallback data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [clienteId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotificaciones();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones de Pago & Avisos</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No tiene notificaciones ni avisos pendientes en el servidor.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.notifCard}>
              <Text style={styles.notifTitle}>{item.titulo || 'Notificación'}</Text>
              <Text style={styles.notifMensaje}>{item.mensaje}</Text>
              <Text style={styles.notifFecha}>{item.fechaEnvio ? String(item.fechaEnvio).substring(0, 10) : ''}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 20 },
  notifCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#1E88E5', elevation: 2 },
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  notifMensaje: { fontSize: 14, color: '#555', marginBottom: 8 },
  notifFecha: { fontSize: 11, color: '#888', textAlign: 'right' },
  emptyContainer: { alignItems: 'center', marginVertical: 40, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center', fontWeight: 'bold', lineHeight: 20 }
});
