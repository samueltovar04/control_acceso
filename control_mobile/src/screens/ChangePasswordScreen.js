import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export const ChangePasswordScreen = ({ route, navigation }) => {
  const userEmail = route?.params?.email || '';
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmacionClave, setConfirmacionClave] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!nuevaClave || !confirmacionClave) {
      Alert.alert('Campos Incompletos', 'Por favor ingrese la nueva contraseña y su confirmación.');
      return;
    }

    if (nuevaClave !== confirmacionClave) {
      Alert.alert('Error', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (nuevaClave.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/cambiar-clave`, {
        correo: userEmail,
        nuevaClave,
        confirmacionClave
      }, { timeout: 5000 });

      setLoading(false);
      Alert.alert(
        '¡Clave Actualizada!',
        'Su contraseña ha sido cambiada exitosamente. Por favor inicie sesión con su nueva clave.',
        [
          { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error) {
      setLoading(false);
      const errMsg = error.response?.data?.error || error.message;
      Alert.alert('Error al Actualizar Clave', errMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Cambio de Clave Obligatorio</Text>
      <Text style={styles.subTitle}>
        Se ha detectado que es su primer ingreso al sistema ({userEmail}). Por políticas de seguridad, debe actualizar su contraseña.
      </Text>

      <Text style={styles.inputLabel}>Nueva Contraseña</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#757575"
          secureTextEntry={!showPass1}
          value={nuevaClave}
          onChangeText={setNuevaClave}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass1(!showPass1)}>
          <Text style={{ fontSize: 20 }}>{showPass1 ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Repita la nueva contraseña"
          placeholderTextColor="#757575"
          secureTextEntry={!showPass2}
          value={confirmacionClave}
          onChangeText={setConfirmacionClave}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass2(!showPass2)}>
          <Text style={{ fontSize: 20 }}>{showPass2 ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Contraseña e Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 10, textAlign: 'center' },
  subTitle: { fontSize: 13, color: '#555555', textAlign: 'center', marginBottom: 25 },
  inputLabel: { width: '100%', fontSize: 13, fontWeight: 'bold', color: '#222222', marginBottom: 5 },
  passwordContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, marginBottom: 16, backgroundColor: '#ffffff' },
  passwordInput: { flex: 1, height: 48, paddingHorizontal: 14, fontSize: 15, color: '#111111', fontWeight: '500' },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  button: { height: 50, backgroundColor: '#2e7d32', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' }
});
