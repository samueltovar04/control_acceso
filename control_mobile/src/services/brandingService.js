import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export const getBrandingConfig = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/branding/config`, { timeout: 3000 });
    return response.data;
  } catch (error) {
    console.warn('Error fetching branding config, using default branding:', error.message);
    return {
      nombreEmpresa: 'Control de Acceso S.A.',
      logoLoginUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      logoMenuUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      colorPrimary: '#1E88E5',
      colorAccent: '#00ACC1'
    };
  }
};
