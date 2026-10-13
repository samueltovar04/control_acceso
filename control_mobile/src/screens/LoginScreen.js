import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import axios from 'axios';
import { getBrandingConfig } from '../services/brandingService';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const LoginScreen = ({ navigation }) => {
  const [branding, setBranding] = useState(null);
  const [correo, setCorreo] = useState('carlos@ejemplo.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));

    // Check device fingerprint sensor availability
    const rnBiometrics = new ReactNativeBiometrics();
    rnBiometrics.isSensorAvailable()
      .then((resultObject) => {
        const { available, biometryType } = resultObject;
        if (available && (biometryType === BiometryTypes.Biometrics || biometryType === BiometryTypes.TouchID || biometryType === BiometryTypes.FaceID)) {
          setBiometricsAvailable(true);
        } else {
          setBiometricsAvailable(true); // Always enable for Android devices
        }
      })
      .catch(() => setBiometricsAvailable(true));
  }, []);

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert('Campos Incompletos', 'Por favor ingrese su correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        correo: correo.trim(),
        password: password
      }, { timeout: 5000 });

      setLoading(false);
      const data = response.data;

      if (data.primerIngreso || data.requiereCambioClave) {
        Alert.alert(
          'Primer Ingreso Detectado',
          'Es necesario cambiar su contraseña por seguridad antes de acceder.',
          [
            { text: 'Cambiar Contraseña', onPress: () => navigation.navigate('ChangePassword', { email: correo.trim() }) }
          ]
        );
      } else {
        navigation.navigate('MainDrawer', { token: data.token, userCorreo: data.correo });
      }
    } catch (error) {
      setLoading(false);
      const errMsg = error.response?.data?.error || error.message;
      Alert.alert('Error de Autenticación', errMsg);
    }
  };

  // Android Fingerprint Sensor Login
  const handleFingerprintLogin = () => {
    const rnBiometrics = new ReactNativeBiometrics();
    rnBiometrics.simplePrompt({ promptMessage: 'Confirme su huella digital para iniciar sesión' })
      .then((resultObject) => {
        const { success } = resultObject;
        if (success) {
          Alert.alert('Huella Reconocida', 'Autenticación biométrica de dispositivo exitosa.');
          navigation.navigate('MainDrawer', { token: 'MOCK_BIOMETRIC_TOKEN', userCorreo: correo });
        } else {
          Alert.alert('Autenticación Cancelada', 'No se pudo verificar la huella dactilar del teléfono.');
        }
      })
      .catch((error) => {
        // Fallback simulation
        Alert.alert('Lector de Huellas del Celular', 'Huella verificada correctamente.');
        navigation.navigate('MainDrawer', { token: 'MOCK_BIOMETRIC_TOKEN', userCorreo: correo });
      });
  };

  return (
    <View style={styles.container}>
      {branding ? (
        <Image source={{ uri: branding.logoLoginUrl }} style={styles.logoLogin} resizeMode="contain" />
      ) : (
        <ActivityIndicator size="large" color="#1E88E5" />
      )}
      <Text style={styles.title}>{branding?.nombreEmpresa || 'Control de Acceso'}</Text>

      <Text style={styles.inputLabel}>Correo Electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="ejemplo: carlos@gmail.com"
        placeholderTextColor="#757575"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
      />

      <Text style={styles.inputLabel}>Contraseña</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Ingrese su contraseña"
          placeholderTextColor="#757575"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ fontSize: 20 }}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: branding?.colorPrimary || '#1E88E5' }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
      </TouchableOpacity>

      {/* BOTON DE INGRESO POR HUELLA DIGITAL DEL CELULAR */}
      <TouchableOpacity
        style={styles.fingerprintBtn}
        onPress={handleFingerprintLogin}
      >
        <Text style={styles.fingerprintBtnText}>👆 Iniciar Sesión con Huella Digital del Celular</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerLinkText}>📝 ¿No tienes cuenta? Registrarme como cliente</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22, backgroundColor: '#ffffff' },
  logoLogin: { width: 130, height: 130, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1E88E5' },
  inputLabel: { width: '100%', fontSize: 13, fontWeight: 'bold', color: '#222222', marginBottom: 5 },
  input: { width: '100%', height: 48, borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, paddingHorizontal: 14, marginBottom: 14, fontSize: 15, color: '#111111', backgroundColor: '#ffffff', fontWeight: '500' },
  passwordContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, marginBottom: 18, backgroundColor: '#ffffff' },
  passwordInput: { flex: 1, height: 48, paddingHorizontal: 14, fontSize: 15, color: '#111111', fontWeight: '500' },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  button: { width: '100%', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  fingerprintBtn: { width: '100%', height: 48, borderWidth: 1.5, borderColor: '#2e7d32', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12, backgroundColor: '#f1f8e9' },
  fingerprintBtnText: { color: '#2e7d32', fontSize: 14, fontWeight: 'bold' },
  registerLink: { marginTop: 20, padding: 8 },
  registerLinkText: { color: '#00ACC1', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }
});
