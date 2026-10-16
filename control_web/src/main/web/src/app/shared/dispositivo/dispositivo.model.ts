export class Dispositivo
{
    public id?: number;
    public state: number = 1;
    public ip: string = "";
    public port: number = 80;
    public descripcion: string = "";
    public ping: boolean = true;
    public entradaSalida: number = 0;
    public color: string = "";
    public piso_id?: number | null;
    public pisoId?: number | null;
    public piso?: any;
    public nombre?: string;
    public estadoConexion?: boolean;
    public tipoDispositivo?: string;
    public sistemaOperativo?: string;
    public tipo?: string;
    public ubicacion?: string;
}
