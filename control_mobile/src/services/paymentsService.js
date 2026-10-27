import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

export const getCotizacionBCV = async (clienteId = 1) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/finanzas/cotizacion-actual`, {
      params: { clienteId },
      timeout: 5000
    });
    const data = response.data;

    // Cache rate in AsyncStorage for offline fallback
    if (data && data.tasaBCV) {
      await AsyncStorage.setItem('CACHE_TASA_BCV', JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.warn('Error fetching cotizacion BCV, checking offline cache:', error.message);
    const cachedStr = await AsyncStorage.getItem('CACHE_TASA_BCV');
    if (cachedStr) {
      return JSON.parse(cachedStr);
    }
    // Fallback default
    return {
      clienteId,
      nombreMembresia: 'Membresía Mensual Pro',
      precioBaseUSD: 50.00,
      tasaBCV: 45.2500,
      montoCalculadoVES: 2262.50,
      fechaVigenciaTasa: new Date().toISOString().substring(0, 10)
    };
  }
};

export const reportarPagoMultimoneda = async (formDataOrPayload) => {
  try {
    const isFormData = typeof FormData !== 'undefined' && formDataOrPayload instanceof FormData;
    const headers = isFormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

    const response = await axios.post(`${API_BASE_URL}/finanzas/pagos/reportar-multimoneda`, formDataOrPayload, {
      headers,
      timeout: 8000
    });

    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

export const subscribeClientePayments = (clienteId, onConciliado, onRechazado) => {
  let ws = null;

  try {
    ws = new WebSocket(`${WS_BASE_URL}/notificaciones`);

    ws.onopen = () => {
      console.log(`WebSocket de Pagos conectado para cliente ${clienteId}`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.evento === 'PAGO_CONCILIADO' || message.tipo === 'PAGO_CONCILIADO' || message.estadoPago === 'COMPLETADO') {
          if (onConciliado) onConciliado(message);
        } else if (message.evento === 'PAGO_RECHAZADO' || message.tipo === 'PAGO_RECHAZADO' || message.estadoPago === 'RECHAZADO') {
          if (onRechazado) onRechazado(message);
        }
      } catch (e) {
        console.warn('Error parseando evento WebSocket:', e.message);
      }
    };

    ws.onerror = (e) => {
      console.warn('Error en WebSocket de pagos:', e.message);
    };

    ws.onclose = () => {
      console.log('WebSocket de Pagos cerrado');
    };
  } catch (err) {
    console.warn('No se pudo inicializar WebSocket de pagos:', err.message);
  }

  return () => {
    if (ws) {
      ws.close();
    }
  };
};
