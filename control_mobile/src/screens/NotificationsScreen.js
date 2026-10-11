import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockNotifs = [
  { id: '1', titulo: 'Aviso de Pago Recibido', mensaje: 'Su pago de $50.00 ha sido aprobado y conciliado.', fecha: '2026-03-01' },
  { id: '2', titulo: 'Recordatorio de Vencimiento', mensaje: 'Su membresía vence en 5 días. Renueve a tiempo.', fecha: '2026-02-25' }
];

export const NotificationsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones de Pago & Avisos</Text>

      <FlatList
        data={mockNotifs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.notifCard}>
            <Text style={styles.notifTitle}>{item.titulo}</Text>
            <Text style={styles.notifMensaje}>{item.mensaje}</Text>
            <Text style={styles.notifFecha}>{item.fecha}</Text>
          </View>
        )}
      />
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
