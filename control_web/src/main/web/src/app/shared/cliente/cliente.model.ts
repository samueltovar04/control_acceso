export interface Cliente {
  id?: number;
  documento: string;
  codigoInsignia?: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  foto?: string;
  sexo?: string;
  fechaNacimiento?: string;
  huella1?: string;
  huella2?: string;
  faceVector?: string;
  estadoSuscripcion?: string;
  sede?: any;
  pisosPermitidos?: any[];
}
