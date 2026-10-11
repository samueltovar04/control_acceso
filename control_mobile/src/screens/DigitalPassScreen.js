import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export const DigitalPassScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pase Digital de Acceso</Text>
      <Text style={styles.subtitle}>Presente este código en los torniquetes o lecturas ópticas de la sucursal</Text>

      <View style={styles.qrContainer}>
        <QRCode value="CLIENTE_PASSE_SECURE_TOKEN_2026_CLIENT_ID_1" size={200} />
      </View>

      <Text style={styles.tokenText}>Token: CLIENT-ACCESS-88219</Text>
      <Text style={styles.statusText}>Estado: PERMITIDO (Membresía Activa)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  qrContainer: { padding: 20, backgroundColor: '#f9f9f9', borderRadius: 16, elevation: 3, marginBottom: 20 },
  tokenText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  statusText: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }
});
