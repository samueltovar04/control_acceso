import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { getBrandingConfig } from '../services/brandingService';

export const LoginScreen = ({ navigation }) => {
  const [branding, setBranding] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));
  }, []);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('MainDrawer');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {branding ? (
        <Image source={{ uri: branding.logoLoginUrl }} style={styles.logoLogin} resizeMode="contain" />
      ) : (
        <ActivityIndicator size="large" color="#1E88E5" />
      )}
      <Text style={styles.title}>{branding?.nombreEmpresa || 'Control de Acceso'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario / Correo"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: branding?.colorPrimary || '#1E88E5' }]}
        onPress={handleLogin}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerLinkText}>📝 ¿No tienes cuenta? Registrarme como nuevo cliente</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  logoLogin: { width: 150, height: 150, marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, color: '#333' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
  button: { width: '100%', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  registerLink: { marginTop: 20, padding: 10 },
  registerLinkText: { color: '#00ACC1', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }
});
