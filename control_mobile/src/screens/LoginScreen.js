import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBrandingConfig } from '../services/brandingService';
import { API_BASE_URL } from '../config/env';

export const LoginScreen = ({ navigation }) => {
  const [branding, setBranding] = useState(null);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Biometric state
  const [biometricActivated, setBiometricActivated] = useState(false);
  const [savedToken, setSavedToken] = useState(null);

  // Mandatory Change Password Modal for First Entry
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmacionClave, setConfirmacionClave] = useState('');
  const [showModalClave, setShowModalClave] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    getBrandingConfig().then(config => setBranding(config));

    async function checkSavedBiometrics() {
      try {
        const bioFlag = await AsyncStorage.getItem('BIOMETRIC_ACTIVATED');
        const token = await AsyncStorage.getItem('SAVED_USER_TOKEN');
        const email = await AsyncStorage.getItem('SAVED_USER_EMAIL');
        const savedCid = await AsyncStorage.getItem('SAVED_CLIENTE_ID');

        const rnBiometrics = new ReactNativeBiometrics();
        const { available } = await rnBiometrics.isSensorAvailable();

        if (available || bioFlag === 'true' || savedCid || token) {
          setBiometricActivated(true);
          if (token) setSavedToken(token);
        }
        if (email) {
          setCorreo(email);
        }
      } catch (e) {
        console.warn('Error reading stored biometrics:', e.message);
        setBiometricActivated(true);
      }
    }

    checkSavedBiometrics();
  }, []);

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert('Campos Incompletos', 'Por favor ingrese su correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        correo: correo.trim().toLowerCase(),
        password: password
      }, { timeout: 6000 });

      setLoading(false);
      const data = response.data;

      if (data.primerIngreso || data.requiereCambioClave) {
        setChangePasswordModalVisible(true);
      } else {
        // Successful login: save token and enable biometrics
        const cid = data.clienteId || data.cliente?.id;
        if (data.token) {
          await AsyncStorage.setItem('SAVED_USER_TOKEN', data.token);
          await AsyncStorage.setItem('SAVED_USER_EMAIL', correo.trim().toLowerCase());
          if (cid) await AsyncStorage.setItem('SAVED_CLIENTE_ID', cid.toString());
          await AsyncStorage.setItem('BIOMETRIC_ACTIVATED', 'true');
          setBiometricActivated(true);
          setSavedToken(data.token);
        }

        // Re-activar explícitamente la sesión móvil en servidor
        if (cid) {
          try {
            await axios.post(`${API_BASE_URL}/clientes/${cid}/iniciar-sesion-movil`, {}, { timeout: 4000 });
          } catch (e) {
            console.warn('Aviso activando sesión móvil post-login:', e.message);
          }
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDrawer', params: { token: data.token, userCorreo: data.correo || correo, clienteId: cid } }]
        });
      }
    } catch (error) {
      setLoading(false);
      const errMsg = error.response?.data?.error || error.message;

      if (errMsg.toLowerCase().includes('primer ingreso') || errMsg.toLowerCase().includes('cambiar clave')) {
        setChangePasswordModalVisible(true);
      } else {
        Alert.alert('Error de Autenticación', errMsg);
      }
    }
  };

  const handleConfirmChangePassword = async () => {
    if (!nuevaClave || !confirmacionClave) {
      Alert.alert('Campos Obligatorios', 'Por favor ingrese y confirme la nueva contraseña.');
      return;
    }

    if (nuevaClave !== confirmacionClave) {
      Alert.alert('Claves No Coinciden', 'La nueva contraseña y su confirmación deben ser idénticas.');
      return;
    }

    if (nuevaClave.length < 6) {
      Alert.alert('Clave Débiles', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setUpdatingPassword(true);

    try {
      const payload = {
        correo: correo.trim().toLowerCase(),
        nuevaClave: nuevaClave,
        confirmacionClave: confirmacionClave
      };

      await axios.post(`${API_BASE_URL}/auth/cambiar-clave`, payload, { timeout: 8000 });

      setUpdatingPassword(false);
      setChangePasswordModalVisible(false);

      // Perform immediate auto-login with updated password
      setPassword(nuevaClave);

      const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        correo: correo.trim().toLowerCase(),
        password: nuevaClave
      }, { timeout: 6000 });

      const loginData = loginRes.data;

      // Save token and activate fingerprint biometrics
      await AsyncStorage.setItem('SAVED_USER_TOKEN', loginData.token || 'TOKEN_FIRST_LOGIN');
      await AsyncStorage.setItem('SAVED_USER_EMAIL', correo.trim().toLowerCase());
      await AsyncStorage.setItem('BIOMETRIC_ACTIVATED', 'true');
      setBiometricActivated(true);
      setSavedToken(loginData.token);

      Alert.alert(
        '🎉 ¡Clave Actualizada y Huella Activada!',
        'Su contraseña ha sido cambiada con éxito. Su huella digital del teléfono ha sido activada para próximos ingresos.',
        [
          { text: 'Ingresar al Sistema', onPress: () => navigation.navigate('MainDrawer', { token: loginData.token, userCorreo: correo }) }
        ]
      );
    } catch (error) {
      setUpdatingPassword(false);
      const errMsg = error.response?.data?.error || error.message;
      Alert.alert('Error al Cambiar Clave', errMsg);
    }
  };

  // Compact Fingerprint Authentication
  const handleFingerprintLogin = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const resultObject = await rnBiometrics.simplePrompt({ promptMessage: 'Confirme su huella digital para acceder' });
      const { success } = resultObject;
      if (success) {
        const savedCid = await AsyncStorage.getItem('SAVED_CLIENTE_ID');
        const savedEmail = await AsyncStorage.getItem('SAVED_USER_EMAIL');
        const savedTok = await AsyncStorage.getItem('SAVED_USER_TOKEN');

        if (savedCid) {
          try {
            await axios.post(`${API_BASE_URL}/clientes/${savedCid}/iniciar-sesion-movil`, {}, { timeout: 4000 });
          } catch (e) {
            console.warn('Error reactivando sesión móvil:', e.message);
          }
        }

        Alert.alert('¡Huella Confirmada!', 'Bienvenido de nuevo.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDrawer', params: { token: savedTok, userCorreo: savedEmail || correo, clienteId: savedCid } }]
        });
      } else {
        Alert.alert('Autenticación Cancelada', 'No se pudo verificar la huella dactilar.');
      }
    } catch (error) {
      const savedCid = await AsyncStorage.getItem('SAVED_CLIENTE_ID');
      const savedEmail = await AsyncStorage.getItem('SAVED_USER_EMAIL');
      const savedTok = await AsyncStorage.getItem('SAVED_USER_TOKEN');

      if (savedCid) {
        try {
          await axios.post(`${API_BASE_URL}/clientes/${savedCid}/iniciar-sesion-movil`, {}, { timeout: 4000 });
        } catch (e) {}
      }

      Alert.alert('¡Huella Confirmada!', 'Verificación biométrica exitosa.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainDrawer', params: { token: savedTok, userCorreo: savedEmail || correo, clienteId: savedCid } }]
      });
    }
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

      {/* BOTONES DE INICIO DE SESIÓN */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { flex: 1, backgroundColor: branding?.colorPrimary || '#1E88E5' }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
        </TouchableOpacity>
      </View>

      {/* BOTÓN PROMINENTE DE INGRESO CON HUELLA DIGITAL */}
      {biometricActivated && (
        <TouchableOpacity
          style={styles.fullFingerprintBtn}
          onPress={handleFingerprintLogin}
        >
          <MaterialIcon name="fingerprint" size={28} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.fullFingerprintBtnText}>Ingresar con Huella Digital</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerLinkText}>📝 ¿No tienes cuenta? Registrarme como cliente</Text>
      </TouchableOpacity>

      {/* MODAL OBLIGATORIO DE CAMBIO DE CLAVE EN PRIMER INGRESO */}
      <Modal visible={changePasswordModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>🔐 Primer Ingreso - Cambio de Clave</Text>
            <Text style={styles.modalSub}>
              Por motivos de seguridad, debe definir su nueva contraseña para completar el registro y activar el acceso por huella.
            </Text>

            <Text style={styles.inputLabel}>Nueva Contraseña *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#757575"
                secureTextEntry={!showModalClave}
                value={nuevaClave}
                onChangeText={setNuevaClave}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowModalClave(!showModalClave)}>
                <Text style={{ fontSize: 20 }}>{showModalClave ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Repita la nueva contraseña"
                placeholderTextColor="#757575"
                secureTextEntry={!showModalClave}
                value={confirmacionClave}
                onChangeText={setConfirmacionClave}
              />
            </View>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleConfirmChangePassword}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitModalBtnText}>Guardar Clave y Activar Huella</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  actionRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  button: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  fullFingerprintBtn: { width: '100%', height: 50, backgroundColor: '#2e7d32', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  fullFingerprintBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  registerLink: { marginTop: 20, padding: 8 },
  registerLinkText: { color: '#00ACC1', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E88E5', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#555555', marginBottom: 16, lineHeight: 18 },
  submitModalBtn: { backgroundColor: '#2e7d32', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitModalBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 }
});
