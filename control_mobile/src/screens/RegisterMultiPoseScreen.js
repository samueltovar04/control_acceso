import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const RegisterMultiPoseScreen = ({ navigation }) => {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  // Multi-Pose Captures
  const [currentStep, setCurrentStep] = useState(1); // 1: Frontal, 2: Left, 3: Right, 4: Tilt
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPoses, setCapturedPoses] = useState({
    frontal: null,
    izquierdo: null,
    derecho: null,
    inclinacion: null
  });

  const getStepInstruction = (step) => {
    switch (step) {
      case 1:
        return { title: 'Paso 1: Rostro Frontal', desc: 'Mire de frente a la cámara selfie.', icon: '🎯', key: 'frontal' };
      case 2:
        return { title: 'Paso 2: Perfil Izquierdo', desc: 'Gire la cabeza levemente hacia la izquierda.', icon: '👈', key: 'izquierdo' };
      case 3:
        return { title: 'Paso 3: Perfil Derecho', desc: 'Gire la cabeza levemente hacia la derecha.', icon: '👉', key: 'derecho' };
      case 4:
        return { title: 'Paso 4: Inclinación Cabeza', desc: 'Incline levemente la cabeza hacia arriba o abajo.', icon: '👆', key: 'inclinacion' };
      default:
        return { title: '¡Captura Multi-Ángulo Completa!', desc: 'Los 4 ángulos faciales han sido capturados.', icon: '✅', key: 'frontal' };
    }
  };

  // Launch REAL front camera selfie
  const handleTakeRealSelfie = (stepKey) => {
    setIsCapturing(true);

    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 600,
      maxWidth: 600,
      quality: 0.8,
      cameraType: 'front'
    };

    launchCamera(options, (response) => {
      setIsCapturing(false);

      if (response.didCancel) return;

      let asset = null;
      if (response.assets && response.assets.length > 0) {
        asset = response.assets[0];
      }

      if (!asset) {
        // Fallback gallery if permission or emulator
        launchImageLibrary(options, (galleryResponse) => {
          if (galleryResponse.assets && galleryResponse.assets.length > 0) {
            asset = galleryResponse.assets[0];
            processCapturedAsset(stepKey, asset);
          }
        });
        return;
      }

      processCapturedAsset(stepKey, asset);
    });
  };

  const processCapturedAsset = (stepKey, asset) => {
    const base64Data = `data:image/jpeg;base64,${asset.base64}`;
    setCapturedPoses(prev => ({
      ...prev,
      [stepKey]: {
        uri: asset.uri,
        base64: base64Data
      }
    }));

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      Alert.alert('¡Enrolamiento Completo!', 'Se han capturado correctamente los 4 ángulos con su cámara selfie.');
    }
  };

  const calculateProgressPercentage = () => {
    let count = 0;
    if (capturedPoses.frontal) count++;
    if (capturedPoses.izquierdo) count++;
    if (capturedPoses.derecho) count++;
    if (capturedPoses.inclinacion) count++;
    return (count / 4) * 100;
  };

  const handleRegisterMultiPose = async () => {
    if (!correo || !clave || !nombre || !apellido || !documento) {
      Alert.alert('Campos Obligatorios', 'Por favor complete Correo, Clave, Nombre, Apellido y Cédula/DNI.');
      return;
    }

    if (!capturedPoses.frontal || !capturedPoses.izquierdo || !capturedPoses.derecho || !capturedPoses.inclinacion) {
      Alert.alert('Captura Incompleta', 'Por favor complete la captura selfie de los 4 ángulos faciales.');
      return;
    }

    setLoading(true);

    try {
      const multiPoseVectorArray = [
        capturedPoses.frontal.base64,
        capturedPoses.izquierdo.base64,
        capturedPoses.derecho.base64,
        capturedPoses.inclinacion.base64
      ];

      const authPayload = {
        correo: correo.trim().toLowerCase(),
        clave: clave,
        fotogramaBase64: JSON.stringify(multiPoseVectorArray),
        tipoMembresia: 'ESTANDAR',
        idPulseraAsignada: ''
      };

      await axios.post(`${API_BASE_URL}/auth/registrar-fotograma`, authPayload, { timeout: 8000 });

      const clientPayload = {
        nombre: nombre,
        apellido: apellido,
        documento: documento,
        email: correo.trim().toLowerCase(),
        telefono: telefono,
        foto: capturedPoses.frontal.uri,
        estadoSuscripcion: 'ACTIVA'
      };

      await axios.post(`${API_BASE_URL}/clientes`, clientPayload, { timeout: 8000 });

      setLoading(false);
      Alert.alert(
        '¡Enrolamiento Exitoso!',
        `El cliente ${nombre} ${apellido} ha sido registrado exitosamente en el servidor Quarkus con sus 4 fotos faciales reales.`,
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

  const instruction = getStepInstruction(currentStep);
  const progressPercent = calculateProgressPercentage();
  const currentStepKey = ['frontal', 'izquierdo', 'derecho', 'inclinacion'][currentStep - 1] || 'frontal';
  const currentCaptured = capturedPoses[currentStepKey];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Captura Facial Multi-Ángulo Guiada</Text>
        <Text style={styles.headerSub}>Visor de cámara selfie frontal para enrolamiento facial</Text>
      </View>

      <View style={styles.formCard}>
        {/* BARRA DE PROGRESO */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso de Enrolamiento Facial</Text>
            <Text style={styles.progressValue}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* CÁMARA SELFIE REAL DEL USUARIO */}
        <View style={styles.embeddedCameraCard}>
          <Text style={styles.guideInstructionTitle}>{instruction.title}</Text>
          <Text style={styles.guideInstructionSub}>{instruction.desc}</Text>

          {/* VISOR CIRCULAR MOSTRANDO LA FOTO REAL DE LA PERSONA */}
          <View style={styles.embeddedViewportRing}>
            {currentCaptured ? (
              <Image source={{ uri: currentCaptured.uri }} style={styles.embeddedSelfieStream} />
            ) : (
              <View style={styles.embeddedCameraStreamPlaceholder}>
                {isCapturing ? (
                  <ActivityIndicator size="large" color="#00ACC1" />
                ) : (
                  <>
                    <Text style={{ fontSize: 46, marginBottom: 4 }}>{instruction.icon}</Text>
                    <Text style={styles.liveSelfieTag}>● CÁMARA SELFIE FRONTAL</Text>
                  </>
                )}
              </View>
            )}
            <View style={styles.faceGuideRingOverlay} />
          </View>

          {/* SELECCIÓN DE ÁNGULOS / BADGES DE CONFIRMACIÓN */}
          <View style={styles.posesGrid}>
            <TouchableOpacity
              style={[styles.poseBadge, capturedPoses.frontal ? styles.poseActive : {}]}
              onPress={() => setCurrentStep(1)}
            >
              <Text style={styles.poseText}>{capturedPoses.frontal ? '✓ 1. Frontal' : '1. Frontal'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.poseBadge, capturedPoses.izquierdo ? styles.poseActive : {}]}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={styles.poseText}>{capturedPoses.izquierdo ? '✓ 2. Izquierdo' : '2. Izquierdo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.poseBadge, capturedPoses.derecho ? styles.poseActive : {}]}
              onPress={() => setCurrentStep(3)}
            >
              <Text style={styles.poseText}>{capturedPoses.derecho ? '✓ 3. Derecho' : '3. Derecho'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.poseBadge, capturedPoses.inclinacion ? styles.poseActive : {}]}
              onPress={() => setCurrentStep(4)}
            >
              <Text style={styles.poseText}>{capturedPoses.inclinacion ? '✓ 4. Inclinación' : '4. Inclinación'}</Text>
            </TouchableOpacity>
          </View>

          {/* BOTÓN DE ACTIVACIÓN DE CÁMARA FRONTAL SELFIE */}
          <TouchableOpacity
            style={styles.captureEmbeddedBtn}
            onPress={() => handleTakeRealSelfie(currentStepKey)}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.captureEmbeddedBtnText}>📷 Tomar Foto Selfie ({instruction.title})</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* DATOS PERSONALES DEL CLIENTE CON TEXTO NEGRO Y ALTO CONTRASTE */}
        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Datos del Cliente</Text>

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

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterMultiPose} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}> Guardar Enrolamiento Multi-Ángulo</Text>
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
  progressContainer: { marginBottom: 15 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: 'bold', color: '#1E88E5' },
  progressValue: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32' },
  progressBarBackground: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2e7d32', borderRadius: 5 },
  embeddedCameraCard: { backgroundColor: '#f0f4f8', padding: 16, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#d0dbe5' },
  guideInstructionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E88E5', textAlign: 'center' },
  guideInstructionSub: { fontSize: 12, color: '#555555', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  embeddedViewportRing: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 4, borderColor: '#00ACC1', marginVertical: 10, elevation: 4 },
  embeddedSelfieStream: { width: 200, height: 200, borderRadius: 100 },
  embeddedCameraStreamPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  liveSelfieTag: { fontSize: 10, fontWeight: 'bold', color: '#00ACC1', marginTop: 4 },
  faceGuideRingOverlay: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: 'rgba(0, 172, 193, 0.6)', borderStyle: 'dashed' },
  posesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginVertical: 12 },
  poseBadge: { width: '48%', backgroundColor: '#ffffff', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#cccccc' },
  poseActive: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
  poseText: { fontSize: 12, fontWeight: 'bold', color: '#111111' },
  captureEmbeddedBtn: { backgroundColor: '#00ACC1', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginTop: 5, width: '100%', alignItems: 'center' },
  captureEmbeddedBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E88E5', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#222222', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, paddingHorizontal: 12, height: 46, marginBottom: 14, fontSize: 15, color: '#111111', backgroundColor: '#ffffff', fontWeight: '500' },
  passwordContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, marginBottom: 14, backgroundColor: '#ffffff' },
  passwordInput: { flex: 1, height: 46, paddingHorizontal: 12, fontSize: 15, color: '#111111', fontWeight: '500' },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  submitBtn: { backgroundColor: '#2e7d32', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
