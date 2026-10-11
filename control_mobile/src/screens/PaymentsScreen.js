import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const mockPagos = [
  { id: '1', fecha: '2026-03-01', monto: '$50.00', metodo: 'Transferencia', estado: 'Completado' },
  { id: '2', fecha: '2026-02-01', monto: '$50.00', metodo: 'Tarjeta Crédito', estado: 'Completado' }
];

export const PaymentsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Pagos & Membresía</Text>

      <View style={styles.cardInfo}>
        <Text style={styles.cardLabel}>Membresía Mensual Pro</Text>
        <Text style={styles.cardAmount}>$50.00 / mes</Text>
        <Text style={styles.cardExpiry}>Próximo Vencimiento: 01/04/2026</Text>
      </View>

      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payButtonText}>Pagar / Renovar Ahora</Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>Historial de Pagos y Comprobantes</Text>

      <FlatList
        data={mockPagos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.pagoItem}>
            <View>
              <Text style={styles.pagoFecha}>{item.fecha} - {item.metodo}</Text>
              <Text style={styles.pagoEstado}>{item.estado}</Text>
            </View>
            <Text style={styles.pagoMonto}>{item.monto}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  cardInfo: { backgroundColor: '#1E88E5', padding: 20, borderRadius: 12, marginBottom: 15 },
  cardLabel: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  cardAmount: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  cardExpiry: { color: '#e0e0e0', fontSize: 12 },
  payButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 25 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  pagoItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pagoFecha: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  pagoEstado: { fontSize: 12, color: '#2e7d32' },
  pagoMonto: { fontSize: 16, fontWeight: 'bold', color: '#1E88E5' }
});
