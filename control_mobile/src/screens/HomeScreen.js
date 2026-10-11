import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { getBrandingConfig } from '../services/brandingService';

export const HomeScreen = ({ navigation }) => {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* CABECERA CON LOGO DEL MENU PRINCIPAL */}
      <View style={[styles.header, { backgroundColor: branding?.colorPrimary || '#1E88E5' }]}>
        {branding?.logoMenuUrl && (
          <Image source={{ uri: branding.logoMenuUrl }} style={styles.logoMenu} resizeMode="contain" />
        )}
        <Text style={styles.headerTitle}>{branding?.nombreEmpresa || 'Menú Principal'}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.welcomeText}>¡Hola, Carlos Pérez!</Text>
        <Text style={styles.subText}>Membresía Mensual: <Text style={{ color: '#2e7d32', fontWeight: 'bold' }}>ACTIVA</Text></Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DigitalPass')}>
            <Text style={styles.cardIcon}>🎟️</Text>
            <Text style={styles.cardTitle}>Pase Digital QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Payments')}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Pagos y Cobros</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VitalSigns')}>
            <Text style={styles.cardIcon}>❤️</Text>
            <Text style={styles.cardTitle}>Signos Vitales</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.cardIcon}>🔔</Text>
            <Text style={styles.cardTitle}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 25, paddingTop: 45, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  logoMenu: { width: 90, height: 90, marginBottom: 10 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  body: { padding: 20 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  subText: { fontSize: 16, color: '#666', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 15, elevation: 2 },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' }
});
