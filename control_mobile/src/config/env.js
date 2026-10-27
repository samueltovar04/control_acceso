import localEnv from './env.local.json';
import prodEnv from './env.production.json';

// Configuración de ambiente de producción activo (https://acceso.andessistemas.com)
export const ENV = prodEnv;

export const API_BASE_URL = ENV.API_BASE_URL;
export const WS_BASE_URL = ENV.WS_BASE_URL;

export default ENV;
