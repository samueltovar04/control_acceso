import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const VitalSignsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Signos Vitales (IoT Wearable)</Text>
      <Text style={styles.subTitle}>Sincronizado en tiempo real con su dispositivo wearable</Text>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Ritmo Cardíaco</Text>
        <Text style={styles.metricValue}>74 <Text style={styles.unit}>BPM</Text></Text>
        <Text style={styles.statusNormal}>Rango Normal</Text>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Saturación de Oxígeno SpO2</Text>
        <Text style={styles.metricValue}>98%</Text>
        <Text style={styles.statusNormal}>Excelente Nivel</Text>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Temperatura Corporal</Text>
        <Text style={styles.metricValue}>36.6 °C</Text>
        <Text style={styles.statusNormal}>Normal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 5 },
  subTitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  metricCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 2 },
  metricTitle: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: '#222', marginVertical: 5 },
  unit: { fontSize: 16, fontWeight: 'normal', color: '#666' },
  statusNormal: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 }
});
