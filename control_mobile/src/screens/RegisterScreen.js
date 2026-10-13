import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const RegisterScreen = ({ navigation }) => {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  // Facial Photo state
  const [fotoUri, setFotoUri] = useState(null);
  const [fotogramaBase64, setFotogramaBase64] = useState(null);

  const handleTakeFacialPhoto = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 600,
      maxWidth: 600,
      quality: 0.8,
      cameraType: 'front'
    };

    launchCamera(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        launchImageLibrary(options, (galleryResponse) => {
          if (galleryResponse.assets && galleryResponse.assets.length > 0) {
            const asset = galleryResponse.assets[0];
            setFotoUri(asset.uri);
            setFotogramaBase64(`data:image/jpeg;base64,${asset.base64}`);
            Alert.alert('Control Facial', 'Foto de rostro seleccionada exitosamente.');
          }
        });
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setFotoUri(asset.uri);
        setFotogramaBase64(`data:image/jpeg;base64,${asset.base64}`);
        Alert.alert('Control Facial', 'Foto de rostro capturada en vivo correctamente.');
      }
    });
  };

  const handleRegisterClient = async () => {
    if (!correo || !clave || !nombre || !apellido || !documento) {
      Alert.alert('Campos Obligatorios', 'Por favor complete Correo, Clave, Nombre, Apellido y Cédula/DNI.');
      return;
    }

    if (!fotogramaBase64) {
      Alert.alert('Fotograma Requerido', 'Es necesario capturar la foto de la cara con la cámara para el reconocimiento facial.');
      return;
    }

    setLoading(true);

    try {
      const authPayload = {
        correo: correo.trim().toLowerCase(),
        clave: clave,
        fotogramaBase64: fotogramaBase64,
        tipoMembresia: 'ESTANDAR',
        idPulseraAsignada: ''
      };

      await axios.post(`${API_BASE_URL}/auth/registrar-fotograma`, authPayload, { timeout: 6000 });

      const clientPayload = {
        nombre: nombre,
        apellido: apellido,
        documento: documento,
        email: correo.trim().toLowerCase(),
        telefono: telefono,
        foto: fotoUri || fotogramaBase64,
        estadoSuscripcion: 'ACTIVA'
      };

      await axios.post(`${API_BASE_URL}/clientes`, clientPayload, { timeout: 6000 });

      setLoading(false);
      Alert.alert(
        '¡Registro de Cliente Exitoso!',
        `El cliente ${nombre} ${apellido} ha sido enrolado exitosamente en el servidor con su foto real.`,
        [
          { text: 'Ir a Iniciar Sesión', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error) {
      setLoading(false);
      const errMsg = error.response?.data?.error || error.message;
      Alert.alert('Error en Registro', errMsg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registro de Cliente con Fotograma Facial</Text>
        <Text style={styles.headerSub}>Enrolamiento biométrico autónomo en el servidor Quarkus</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>1. Identificación y Datos Personales</Text>

        <Text style={styles.fieldLabel}>Correo Electrónico *</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo: carlos@gmail.com"
          placeholderTextColor="#757575"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
        />

        <Text style={styles.fieldLabel}>Contraseña de Acceso *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#757575"
            secureTextEntry={!showPassword}
            value={clave}
            onChangeText={setClave}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ fontSize: 20 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.fieldLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#757575"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.fieldLabel}>Apellido *</Text>
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor="#757575"
              value={apellido}
              onChangeText={setApellido}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Cédula / Documento de Identidad *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: V-18234567"
          placeholderTextColor="#757575"
          value={documento}
          onChangeText={setDocumento}
        />

        <Text style={styles.fieldLabel}>Número de Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 04121234567"
          placeholderTextColor="#757575"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />

        {/* SECCION CAPTURA FACIAL REAL CON CAMARA */}
        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>2. Captura de Fotograma Facial (Cámara)</Text>
        <View style={styles.cameraBox}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.capturedImage} />
          ) : (
            <View style={styles.placeholderFace}>
              <Text style={{ fontSize: 42 }}>👤</Text>
              <Text style={styles.placeholderText}>Fotograma de Rostro Requerido</Text>
            </View>
          )}

          <TouchableOpacity style={styles.cameraBtn} onPress={handleTakeFacialPhoto}>
            <Text style={styles.cameraBtnText}>📷 Tomar Foto de la Cara</Text>
          </TouchableOpacity>
          {fotogramaBase64 && <Text style={styles.successTag}>✓ Fotograma facial codificado en Base64</Text>}
        </View>

        {/* BOTON DE REGISTRO REAL */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterClient} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Registrar Cliente en Servidor</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { backgroundColor: '#1E88E5', padding: 20, paddingTop: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#e3f2fd', fontSize: 12, marginTop: 4 },
  formCard: { backgroundColor: '#ffffff', margin: 15, padding: 18, borderRadius: 16, elevation: 3 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E88E5', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#222222', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, paddingHorizontal: 12, height: 46, marginBottom: 14, fontSize: 15, color: '#111111', backgroundColor: '#ffffff', fontWeight: '500' },
  passwordContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, marginBottom: 14, backgroundColor: '#ffffff' },
  passwordInput: { flex: 1, height: 46, paddingHorizontal: 12, fontSize: 15, color: '#111111', fontWeight: '500' },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cameraBox: { alignItems: 'center', backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  placeholderFace: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  placeholderText: { fontSize: 10, color: '#666666', marginTop: 4, textAlign: 'center' },
  capturedImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 12, borderWidth: 3, borderColor: '#1E88E5' },
  cameraBtn: { backgroundColor: '#00ACC1', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  cameraBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  successTag: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  submitBtn: { backgroundColor: '#2e7d32', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
