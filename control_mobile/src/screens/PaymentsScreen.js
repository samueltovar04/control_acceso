import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView, Image, Vibration, Switch } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getCotizacionBCV, reportarPagoMultimoneda, subscribeClientePayments } from '../services/paymentsService';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.140:8080/api/v1';

export const PaymentsScreen = ({ route }) => {
  const clienteId = route?.params?.clienteId || 1;

  // Real Backend Data
  const [cliente, setCliente] = useState(null);
  const [bcvData, setBcvData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Payments History List & Pagination
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Payment Report Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Form Fields
  const [metodoPago, setMetodoPago] = useState('PAGO_MOVIL');
  const [numeroReferencia, setNumeroReferencia] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().substring(0, 10));
  const [receiptImage, setReceiptImage] = useState(null); // { uri, base64 }
  const [submitting, setSubmitting] = useState(false);

  // Cupon de Descuento
  const [codigoCupon, setCodigoCupon] = useState('');
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [cuponInfo, setCuponInfo] = useState(null);

  const fetchClienteAndBCV = async () => {
    setLoading(true);
    try {
      // 1. Fetch real client profile
      const clientRes = await axios.get(`${API_BASE_URL}/clientes/${clienteId}`, { timeout: 5000 });
      setCliente(clientRes.data);

      // 2. Fetch live BCV rate & membership pricing for this client
      const bcvRes = await getCotizacionBCV(clienteId);
      setBcvData(bcvRes);
    } catch (error) {
      console.warn('Error fetching client & BCV pricing from backend:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPagos = async () => {
    setLoadingPagos(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/finanzas/pagos`, { timeout: 5000 });
      setPagos(response.data || []);
    } catch (error) {
      console.warn('Error fetching pagos:', error.message);
    } finally {
      setLoadingPagos(false);
    }
  };

  useEffect(() => {
    fetchClienteAndBCV();
    fetchPagos();

    // Subscribe to WebSocket real-time payment reconciliation events
    const unsubscribe = subscribeClientePayments(
      clienteId,
      (eventData) => {
        Vibration.vibrate([0, 500, 200, 500]); // Haptic vibration feedback
        fetchClienteAndBCV();
        fetchPagos();
        Alert.alert('🎉 ¡Pago Conciliado!', 'Su pago ha sido verificado y conciliado exitosamente por la administración. Su membresía está ACTIVA.');
      },
      (eventData) => {
        const motivo = eventData.motivoRechazo || eventData.mensaje || 'El número de referencia no coincide con el comprobante bancario.';
        setMotivoRechazo(motivo);
        fetchClienteAndBCV();
        fetchPagos();
        setRejectionModalVisible(true);
      }
    );

    return () => unsubscribe();
  }, [clienteId]);

  const handleSelectReceiptImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setReceiptImage({
          uri: asset.uri,
          base64: `data:image/jpeg;base64,${asset.base64}`
        });
      }
    });
  };

  const handleValidarCupon = async () => {
    if (!codigoCupon || !codigoCupon.trim()) {
      Alert.alert('Cupón requerido', 'Por favor ingrese el código del cupón.');
      return;
    }
    setValidandoCupon(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/membresias/promociones/validar-cupon`, {
        codigo: codigoCupon.trim().toUpperCase(),
        membresiaId: cliente?.membresiaActual?.id || null,
        precioOriginal: bcvData?.precioBaseUSD || 30.00
      }, { timeout: 6000 });

      if (res.data?.valido) {
        setCuponInfo(res.data);
        Alert.alert('¡Cupón Válido!', `${res.data.mensaje || 'Promoción aplicada con éxito.'}\nNuevo Monto: $${res.data.montoFinal} USD`);
      } else {
        setCuponInfo(null);
        Alert.alert('Cupón No Válido', res.data?.mensaje || 'El cupón no es válido o ha expirado.');
      }
    } catch (e) {
      setCuponInfo(null);
      Alert.alert('Error', 'No se pudo validar el cupón.');
    } finally {
      setValidandoCupon(false);
    }
  };

  const handleSubmitMultimonedaPayment = async () => {
    if (!numeroReferencia || numeroReferencia.trim().length === 0) {
      Alert.alert('Número de Referencia Requerido', 'Por favor ingrese el número de referencia bancaria escrito en el comprobante.');
      return;
    }

    if (!receiptImage) {
      Alert.alert('Comprobante Obligatorio', 'OBLIGATORIO: Debe subir la foto o capture de pantalla del comprobante de pago con el número de referencia.');
      return;
    }

    setSubmitting(true);

    try {
      const tasaCalculada = bcvData?.tasaBCV || 45.2500;
      let montoUsdVal = cuponInfo?.montoFinal != null ? cuponInfo.montoFinal : (bcvData?.precioBaseUSD || 30.00);
      let montoVesVal = (montoUsdVal * tasaCalculada);

      const payload = {
        clienteId: clienteId,
        montoOriginal: montoUsdVal,
        monedaDeclarada: 'USD',
        tasaBcv: tasaCalculada,
        montoEquivalenteVES: Number(montoVesVal.toFixed(2)),
        metodoPago: metodoPago,
        numeroReferencia: numeroReferencia.trim(),
        fechaPago: fechaPago,
        comprobanteBase64: receiptImage.base64,
        codigoCupon: cuponInfo ? cuponInfo.codigo : (codigoCupon.trim() || null)
      };

      const res = await reportarPagoMultimoneda(payload);

      setSubmitting(false);
      setModalVisible(false);
      setCuponInfo(null);
      setCodigoCupon('');

      Alert.alert(
        '¡Reporte de Pago Recibido!',
        `Su comprobante con referencia ${numeroReferencia} ha sido registrado. Se habilitó acceso temporal en los torniquetes mientras el administrador concilia.`
      );

      fetchClienteAndBCV();
      fetchPagos();
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error en Reporte', error.message);
    }
  };

  // Scheduled Cancellation Toggle Handler
  const handleToggleAutoRenovar = async (newValue) => {
    if (!newValue) {
      Alert.alert(
        '⚠️ Desactivar Auto-Renovación',
        `¿Desea cancelar la auto-renovación? Conservará el acceso completo al gimnasio hasta la fecha de vencimiento (${fechaVencimientoFormatted || 'final del mes en curso'}) y no se generará el cobro del próximo mes.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, Desactivar',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await axios.post(`${API_BASE_URL}/clientes/${clienteId}/cancelar-renovacion`, {}, { timeout: 6000 });
                Alert.alert('¡Auto-Renovación Desactivada!', res.data?.mensaje || 'Mantiene su acceso garantizado hasta la fecha de vencimiento sin generar pagos futuros.');
                fetchClienteAndBCV();
              } catch (e) {
                const errMsg = e.response?.data?.error || e.message;
                Alert.alert('Error', `No se pudo desactivar la auto-renovación: ${errMsg}`);
              }
            }
          }
        ]
      );
    } else {
      try {
        const res = await axios.post(`${API_BASE_URL}/clientes/${clienteId}/reactivar-renovacion`, {}, { timeout: 6000 });
        Alert.alert('¡Auto-Renovación Reactivada!', res.data?.mensaje || 'Su membresía se renovará automáticamente al llegar la fecha de vencimiento.');
        fetchClienteAndBCV();
      } catch (e) {
        const errMsg = e.response?.data?.error || e.message;
        Alert.alert('Error', `No se pudo reactivar la auto-renovación: ${errMsg}`);
      }
    }
  };

  // Extract Membership and Pricing Info from Server
  const rawNombreMembresia = bcvData?.nombreMembresia || cliente?.membresiaActual?.nombre || '';
  const hasMembresiaAsignada = rawNombreMembresia && rawNombreMembresia !== 'Sin membresia asignada';

  const estadoSuscripcionRaw = cliente?.estadoSuscripcion || 'MOROSO';
  const autoRenovarActive = cliente?.autoRenovar !== false && estadoSuscripcionRaw !== 'CANCELACION_PROGRAMADA';

  const isPendingOrDelinquent = estadoSuscripcionRaw === 'MOROSO' || estadoSuscripcionRaw === 'PENDIENTE_CONCILIAR' || estadoSuscripcionRaw === 'PENDIENTE_PAGO' || estadoSuscripcionRaw === 'NO_PAGADO' || estadoSuscripcionRaw === 'POR_VENCER';

  // Enable Report Payment button ONLY if client HAS an assigned membership AND has a pending/delinquent payment
  const isReportButtonEnabled = hasMembresiaAsignada && isPendingOrDelinquent;

  // Actual Server USD Price & VES Calculation
  const precioBaseUSD = bcvData?.precioBaseUSD || cliente?.membresiaActual?.precio || 0;
  const tasaBcvVal = bcvData?.tasaBCV || 45.2500;
  const montoCalculadoVES = bcvData?.montoCalculadoVES || (precioBaseUSD * tasaBcvVal);

  // Expiration Date
  const fechaVencimientoRaw = cliente?.fechaVencimientoMembresia || cliente?.fechaProximoCobro || '';
  const fechaVencimientoFormatted = fechaVencimientoRaw ? String(fechaVencimientoRaw).substring(0, 10) : '';

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(pagos.length / pageSize));
  const paginatedPagos = pagos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestión de Pagos & Membresía</Text>

      {/* TARJETA DE ESTADO DE MEMBRESIA ASOCIADA DESDE SERVIDOR */}
      <View style={[
        styles.statusCard,
        !hasMembresiaAsignada ? { backgroundColor: '#757575' } :
        estadoSuscripcionRaw === 'ACTIVA' || estadoSuscripcionRaw === 'AL_DIA' ? { backgroundColor: '#2e7d32' } :
        estadoSuscripcionRaw === 'CANCELACION_PROGRAMADA' ? { backgroundColor: '#f57c00' } :
        estadoSuscripcionRaw === 'PENDIENTE_CONCILIAR' ? { backgroundColor: '#ffa000' } :
        { backgroundColor: '#c62828' }
      ]}>
        <Text style={styles.statusLabel}>
          Membresía Asociada: {hasMembresiaAsignada ? rawNombreMembresia : 'Sin membresía asignada'}
        </Text>

        {hasMembresiaAsignada && (
          <Text style={styles.statusValue}>
            {estadoSuscripcionRaw === 'ACTIVA' || estadoSuscripcionRaw === 'AL_DIA' ? 'MEMBRESÍA ACTIVA' :
             estadoSuscripcionRaw === 'CANCELACION_PROGRAMADA' ? 'CANCELACIÓN PROGRAMADA' :
             estadoSuscripcionRaw === 'PENDIENTE_CONCILIAR' ? 'PAGO EN REVISIÓN (ACCESO TEMPORAL)' :
             'MOROSO / PAGO PENDIENTE'}
          </Text>
        )}

        {hasMembresiaAsignada && fechaVencimientoFormatted ? (
          <Text style={styles.statusExpiry}>
            {estadoSuscripcionRaw === 'CANCELACION_PROGRAMADA'
              ? `Acceso Garantizado Hasta: ${fechaVencimientoFormatted} (No se cobrará próximo mes)`
              : `Vencimiento Próximo Cobro: ${fechaVencimientoFormatted}`}
          </Text>
        ) : null}
      </View>

      {/* TARJETA MODERNA DE INTERRUPTOR DE AUTO-RENOVACION (CHOICE TOGGLE) */}
      {hasMembresiaAsignada && (
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Auto-renovación de Membresía</Text>
            <Text style={styles.toggleSub}>
              {autoRenovarActive
                ? 'Su membresía se renovará automáticamente en la fecha de vencimiento.'
                : `Cancelación programada en proceso. Mantendrá acceso libre al gimnasio hasta el ${fechaVencimientoFormatted || 'vencimiento'} y no se generará cobro para el siguiente mes.`}
            </Text>
          </View>
          <Switch
            value={autoRenovarActive}
            onValueChange={handleToggleAutoRenovar}
            trackColor={{ false: '#ffb74d', true: '#81c784' }}
            thumbColor={autoRenovarActive ? '#2e7d32' : '#e65100'}
          />
        </View>
      )}

      {/* BANNER DE ACCESO TEMPORAL DE GRACIA (48 HORAS) */}
      {estadoSuscripcionRaw === 'PENDIENTE_CONCILIAR' && (
        <View style={styles.graceCard}>
          <Text style={styles.graceTitle}>🎉 ¡Acceso Temporal Habilitado!</Text>
          <Text style={styles.graceText}>
            Dispone de horas de gracia en los torniquetes mientras el administrador concilia su pago.
          </Text>
        </View>
      )}

      {/* DESGLOSE DE TASA OFICIAL BCV Y COSTO REAL DE MEMBRESIA DESDE SERVIDOR */}
      <View style={styles.bcvCard}>
        <View style={styles.bcvHeader}>
          <Text style={styles.bcvTitle}>💵 Cotización BCV del Día</Text>
          {loading && <ActivityIndicator size="small" color="#1E88E5" />}
        </View>

        <View style={styles.bcvRow}>
          <Text style={styles.bcvLabel}>Membresía Asociada:</Text>
          <Text style={styles.bcvVal}>{hasMembresiaAsignada ? rawNombreMembresia : 'Sin membresía'}</Text>
        </View>

        <View style={styles.bcvRow}>
          <Text style={styles.bcvLabel}>Costo en Moneda Base (USD):</Text>
          <Text style={styles.bcvVal}>
            {hasMembresiaAsignada && precioBaseUSD > 0 ? `$${precioBaseUSD.toFixed(2)} USD` : '-'}
          </Text>
        </View>

        <View style={styles.bcvRow}>
          <Text style={styles.bcvLabel}>Tasa Oficial BCV:</Text>
          <Text style={styles.bcvVal}>{tasaBcvVal.toFixed(4)} VES/USD</Text>
        </View>

        <View style={[styles.bcvRow, { borderTopWidth: 1, borderColor: '#e0e0e0', paddingTop: 8, marginTop: 4 }]}>
          <Text style={styles.bcvLabelBold}>Monto Exacto en Bolívares (VES):</Text>
          <Text style={styles.bcvValBold}>
            {hasMembresiaAsignada && montoCalculadoVES > 0
              ? `Bs. ${montoCalculadoVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '-'}
          </Text>
        </View>
      </View>

      {/* BOTON PARA ABRIR EL MODAL DE REPORTE DE PAGO (DESACTIVADO SI NO TIENE MEMBRESIA O PAGO PENDIENTE) */}
      <TouchableOpacity
        style={[
          styles.reportBtn,
          !isReportButtonEnabled ? { backgroundColor: '#b0bec5' } :
          estadoSuscripcionRaw === 'PENDIENTE_CONCILIAR' ? { backgroundColor: '#ffa000' } : {}
        ]}
        onPress={() => isReportButtonEnabled && setModalVisible(true)}
        disabled={!isReportButtonEnabled}
      >
        <Text style={styles.reportBtnText}>
          {!hasMembresiaAsignada ? '🚫 Sin Membresía Asociada' :
           estadoSuscripcionRaw === 'PENDIENTE_CONCILIAR' ? '💳 Reportar Otro Pago' :
           isReportButtonEnabled ? '💳 Reportar Pago Multimoneda' :
           '✓ Al Día / Sin Pagos Pendientes'}
        </Text>
      </TouchableOpacity>

      {/* HISTORIAL DE PAGOS PAGINADO */}
      <Text style={styles.historyTitle}>Historial de Pagos</Text>
      {loadingPagos ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 15 }} />
      ) : (
        <>
          {paginatedPagos.map((p, idx) => (
            <View key={p.id ? p.id.toString() : idx.toString()} style={styles.historyItem}>
              <View>
                <Text style={styles.historyRef}>Ref: {p.numeroReferencia || 'S/N'} ({p.metodoPago || 'PAGO_MOVIL'})</Text>
                <Text style={styles.historyStatus}>{p.estadoPago || 'COMPLETADO'}</Text>
              </View>
              <Text style={styles.historyMonto}>${p.monto || precioBaseUSD || '30.00'}</Text>
            </View>
          ))}

          {/* CONTROLES DE PAGINACION DE GRILLA */}
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.paginationBtn, currentPage === 1 ? styles.paginationDisabled : {}]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationBtnText}>◀ Anterior</Text>
            </TouchableOpacity>

            <Text style={styles.paginationText}>Página {currentPage} de {totalPages}</Text>

            <TouchableOpacity
              style={[styles.paginationBtn, currentPage >= totalPages ? styles.paginationDisabled : {}]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              <Text style={styles.paginationBtnText}>Siguiente ▶</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* MODAL DE REPORTE MULTIMONEDA CON CAMPOS FIJOS E INMODIFICABLES */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Reportar Comprobante ({hasMembresiaAsignada ? rawNombreMembresia : 'Membresía General'})</Text>

            <Text style={styles.fieldLabel}>Costo Membresía Base ($ USD) [Monto Fijo Server]</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={`$${precioBaseUSD.toFixed(2)} USD`}
              editable={false}
            />

            {/* SECCION DE CUPON / PROMOCION */}
            <Text style={styles.fieldLabel}>Cupón de Descuento o Promoción</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, textTransform: 'uppercase' }]}
                placeholder="Ej. PROMO2X1"
                placeholderTextColor="#757575"
                autoCapitalize="characters"
                value={codigoCupon}
                onChangeText={setCodigoCupon}
                editable={!cuponInfo}
              />
              {cuponInfo ? (
                <TouchableOpacity
                  style={{ backgroundColor: '#e53935', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12 }}
                  onPress={() => { setCuponInfo(null); setCodigoCupon(''); }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Quitar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ backgroundColor: '#2e7d32', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 14 }}
                  onPress={handleValidarCupon}
                  disabled={validandoCupon}
                >
                  {validandoCupon ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Aplicar</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {cuponInfo && (
              <View style={{ backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: '#a5d6a7' }}>
                <Text style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 13 }}>
                  ✓ {cuponInfo.nombre} ({cuponInfo.codigo})
                </Text>
                <Text style={{ color: '#388e3c', fontSize: 12, marginTop: 2 }}>
                  Descuento: -${cuponInfo.descuentoMonto?.toFixed(2)} USD | Total Final: ${cuponInfo.montoFinal?.toFixed(2)} USD
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Monto Calculado en Bolívares (VES)</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>
                Bs. {((cuponInfo?.montoFinal != null ? cuponInfo.montoFinal : precioBaseUSD) * tasaBcvVal).toFixed(2)} (Tasa BCV: {tasaBcvVal.toFixed(4)})
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Número de Referencia Bancaria * (Obligatorio)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 882193"
              placeholderTextColor="#757575"
              keyboardType="numeric"
              value={numeroReferencia}
              onChangeText={setNumeroReferencia}
            />

            <Text style={styles.fieldLabel}>Fecha de Pago</Text>
            <TextInput style={styles.input} value={fechaPago} onChangeText={setFechaPago} />

            {/* SELECCIÓN Y PREVISUALIZACIÓN OBLIGATORIA DE FOTO DE COMPROBANTE */}
            <Text style={styles.fieldLabel}>Foto del Comprobante de Pago * (Obligatorio)</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handleSelectReceiptImage}>
              <Text style={styles.imagePickerBtnText}>📷 Adjuntar Foto del Ticket Bancario</Text>
            </TouchableOpacity>

            {receiptImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: receiptImage.uri }} style={styles.previewThumbnail} />
                <Text style={styles.previewTag}>✓ Foto de comprobante adjuntada obligatoriamente</Text>
              </View>
            ) : (
              <Text style={styles.warningPhotoTag}>⚠️ Debe subir la foto del comprobante para habilitar el reporte.</Text>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, !receiptImage ? { backgroundColor: '#9e9e9e' } : {}]}
              onPress={handleSubmitMultimonedaPayment}
              disabled={submitting || !receiptImage}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Enviar Reporte a Conciliación</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL DE ADVERTENCIA DE PAGO RECHAZADO */}
      <Modal visible={rejectionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: '#ffebee' }]}>
            <Text style={[styles.modalTitle, { color: '#c62828' }]}>⚠️ Pago Rechazado</Text>
            <Text style={{ fontSize: 14, color: '#333', marginVertical: 10 }}>
              El administrador rechazó el pago debido a:
            </Text>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828', backgroundColor: '#fff', padding: 12, borderRadius: 8 }}>
              {motivoRechazo}
            </Text>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#c62828', marginTop: 20 }]}
              onPress={() => setRejectionModalVisible(false)}
            >
              <Text style={styles.submitBtnText}>Entendido - Reportar Nuevamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#f4f6f9' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 15 },
  statusCard: { padding: 18, borderRadius: 16, marginBottom: 12, elevation: 3 },
  statusLabel: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  statusValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
  statusExpiry: { color: '#e3f2fd', fontSize: 11 },
  toggleCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#e0e0e0' },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E88E5' },
  toggleSub: { fontSize: 11, color: '#666666', marginTop: 3, lineHeight: 15 },
  graceCard: { backgroundColor: '#e8f5e9', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2e7d32', marginBottom: 14 },
  graceTitle: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 },
  graceText: { fontSize: 12, color: '#1b5e20' },
  bcvCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 14, elevation: 2 },
  bcvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bcvTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E88E5' },
  bcvRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  bcvLabel: { fontSize: 13, color: '#555' },
  bcvVal: { fontSize: 13, fontWeight: 'bold', color: '#222' },
  bcvLabelBold: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32' },
  bcvValBold: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  reportBtn: { backgroundColor: '#2e7d32', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 3 },
  reportBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E88E5', marginBottom: 12 },
  historyItem: { backgroundColor: '#ffffff', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, elevation: 1 },
  historyRef: { fontSize: 13, fontWeight: 'bold', color: '#222' },
  historyStatus: { fontSize: 11, color: '#2e7d32', fontWeight: 'bold' },
  historyMonto: { fontSize: 15, fontWeight: 'bold', color: '#1E88E5' },
  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, paddingHorizontal: 5 },
  paginationBtn: { backgroundColor: '#1E88E5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  paginationDisabled: { backgroundColor: '#b0bec5' },
  paginationBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  paginationText: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E88E5', marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#222222', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#b0bec5', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 12, fontSize: 14, color: '#111111', backgroundColor: '#ffffff' },
  readOnlyInput: { backgroundColor: '#f0f4f8', color: '#2e7d32', fontWeight: 'bold' },
  readOnlyBox: { backgroundColor: '#f0f4f8', padding: 12, borderRadius: 8, marginBottom: 12 },
  readOnlyText: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32' },
  imagePickerBtn: { backgroundColor: '#00ACC1', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  imagePickerBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  previewContainer: { alignItems: 'center', marginVertical: 10 },
  previewThumbnail: { width: 140, height: 140, borderRadius: 8, marginBottom: 4 },
  previewTag: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold' },
  warningPhotoTag: { color: '#c62828', fontSize: 11, fontWeight: 'bold', marginVertical: 6, textAlign: 'center' },
  submitBtn: { backgroundColor: '#2e7d32', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  cancelBtnText: { color: '#757575', fontWeight: 'bold' }
});
