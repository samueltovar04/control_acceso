import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis
} from 'recharts';

export interface TelemetriaItem {
  id_pulsera: string;
  bpm: number;
  spo2: number;
  temp: number;
  alerta: number;
  timestamp?: string;
}

interface HistorialPunto {
  time: string;
  bpm: number;
}

interface PulseraEstado {
  id_pulsera: string;
  bpm: number;
  spo2: number;
  temp: number;
  alerta: number;
  historialBpm: HistorialPunto[];
  ultimaLectura: string;
}

// Bateria inicial de pulseras
const PULSERAS_INICIALES: string[] = [
  "PULSERA_001", "PULSERA_002", "PULSERA_003", "PULSERA_004", "PULSERA_005",
  "PULSERA_006", "PULSERA_007", "PULSERA_008", "PULSERA_009", "PULSERA_010"
];

export const DashboardBiomedico: React.FC = () => {
  const [pulseras, setPulseras] = useState<Record<string, PulseraEstado>>(() => {
    const init: Record<string, PulseraEstado> = {};
    PULSERAS_INICIALES.forEach((id) => {
      init[id] = {
        id_pulsera: id,
        bpm: 72,
        spo2: 98,
        temp: 36.5,
        alerta: 0,
        historialBpm: Array.from({ length: 8 }, (_, i) => ({ time: `${i}s`, bpm: 70 + (i % 3) })),
        ultimaLectura: 'En espera'
      };
    });
    return init;
  });

  const [wsConectado, setWsConectado] = useState<boolean>(false);
  const [emuladorActivo, setEmuladorActivo] = useState<boolean>(false);
  const [sedes, setSedes] = useState<Array<{ id: number; sede: string }>>([]);
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState<number | null>(null);
  const [sedeBloqueada, setSedeBloqueada] = useState<boolean>(false);
  const [pulseraSedeMap, setPulseraSedeMap] = useState<Map<string, number>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cargar Sedes
    fetch('/api/v1/sedes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSedes(data);
      })
      .catch(err => console.warn('Error cargando sedes:', err));

    // Cargar Clientes para mapeo de pulsera a Sede
    fetch('/api/v1/clientes')
      .then(res => res.json())
      .then(clientes => {
        if (Array.isArray(clientes)) {
          const map = new Map<string, number>();
          clientes.forEach((c: any) => {
            const pulsera = c.codigoInsignia ? c.codigoInsignia.trim().toUpperCase() : null;
            const sId = c.sede?.id || c.sede_id || c.sedeId;
            if (pulsera && sId) map.set(pulsera, Number(sId));
          });
          setPulseraSedeMap(map);
        }
      })
      .catch(err => console.warn('Error cargando clientes:', err));

    // Reglas de sesion de usuario
    const rawUser = localStorage.getItem('currentUser');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        const rol = String(user.role || '').toUpperCase();
        const esAdmin = rol === 'ADMIN' || rol === 'SUPER_ADMIN' || rol === 'SUPERADMIN';
        const userSedeId = user.sedeId || (user.sede && user.sede.id);
        if (!esAdmin && userSedeId) {
          setSedeSeleccionadaId(Number(userSedeId));
          setSedeBloqueada(true);
          return;
        }
      } catch (e) {}
    }

    const stored = localStorage.getItem('control_acceso_sede_seleccionada');
    if (stored && stored !== 'null') {
      setSedeSeleccionadaId(Number(stored));
    }
  }, []);

  const handleSedeChange = (val: string) => {
    if (sedeBloqueada) return;
    const newId = val ? Number(val) : null;
    setSedeSeleccionadaId(newId);
    if (newId) {
      localStorage.setItem('control_acceso_sede_seleccionada', String(newId));
    } else {
      localStorage.removeItem('control_acceso_sede_seleccionada');
    }
  };

  // Conexion WebSocket con Token JWT
  useEffect(() => {
    const token = 'DEMO_TOKEN_CLIENT';
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8080';
    const ws = new WebSocket(`${proto}//${host}/ws/vital-signs?token=${token}`);

    ws.onopen = () => setWsConectado(true);
    ws.onclose = () => setWsConectado(false);
    ws.onerror = () => setWsConectado(false);

    ws.onmessage = (event) => {
      try {
        const item: TelemetriaItem = JSON.parse(event.data);
        procesarLectura(item);
      } catch (err) {
        console.error('Error parseando telemetria:', err);
      }
    };

    return () => ws.close();
  }, []);

  const procesarLectura = (item: TelemetriaItem) => {
    const hora = new Date().toTimeString().split(' ')[0];

    setPulseras((prev) => {
      const actual = prev[item.id_pulsera] || {
        id_pulsera: item.id_pulsera,
        bpm: item.bpm,
        spo2: item.spo2,
        temp: item.temp,
        alerta: item.alerta,
        historialBpm: [],
        ultimaLectura: hora
      };

      const nuevoHistorial = [...actual.historialBpm.slice(-15), { time: hora, bpm: item.bpm }];

      return {
        ...prev,
        [item.id_pulsera]: {
          ...actual,
          bpm: item.bpm,
          spo2: item.spo2,
          temp: item.temp,
          alerta: item.alerta,
          historialBpm: nuevoHistorial,
          ultimaLectura: hora
        }
      };
    });
  };

  // Emulador de Gateway en Frontend (10 pulseras dinamicas)
  const toggleEmulador = () => {
    if (emuladorActivo) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setEmuladorActivo(false);
    } else {
      setEmuladorActivo(true);
      intervalRef.current = setInterval(async () => {
        const idRandom = PULSERAS_INICIALES[Math.floor(Math.random() * PULSERAS_INICIALES.length)];
        const rnd = Math.random();
        
        let bpm = Math.floor(65 + Math.random() * 25);
        let spo2 = Math.floor(96 + Math.random() * 4);
        let temp = parseFloat((36.2 + Math.random() * 0.7).toFixed(2));
        let alerta = 0;

        // Inyeccion aleatoria de condicion critica
        if (rnd < 0.12) {
          bpm = 158;
          alerta = 1;
        } else if (rnd < 0.20) {
          spo2 = 87;
          alerta = 1;
        }

        const payload: TelemetriaItem = { id_pulsera: idRandom, bpm, spo2, temp, alerta };

        try {
          await fetch('/api/v1/telemetria/vitales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch {
          // Si el backend no esta conectado directamente, procesar en estado local
          procesarLectura(payload);
        }
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pulserasFiltradas = Object.values(pulseras).filter((p) => {
    if (sedeSeleccionadaId === null) return true;
    const sId = pulseraSedeMap.get(p.id_pulsera.toUpperCase());
    if (!sId) return true;
    return Number(sId) === Number(sedeSeleccionadaId);
  });

  const totalAlertas = pulserasFiltradas.filter((p) => p.alerta === 1).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6 selection:bg-rose-500 selection:text-white">
      {/* Header Central */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-950/40">
            BT
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              BioTrack Enterprise: Telemetría Dinámica de Pulseras
            </h1>
            <p className="text-xs text-slate-400">Conexión y desconexión autónoma de brazaletes con expiración por inactividad</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConectado ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-slate-300">{wsConectado ? 'WebSocket Activo' : 'Desconectado'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <span className="text-slate-400">Pulseras:</span>
            <span className="text-cyan-400 font-bold">{pulserasFiltradas.length}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <span className="text-slate-400">Alertas Activas:</span>
            <span className={totalAlertas > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{totalAlertas}</span>
          </div>

          <button
            onClick={toggleEmulador}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 ${
              emuladorActivo
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
            }`}
          >
            <span>{emuladorActivo ? '⏸ Detener Emulador' : '▶ Emular Gateway (10 Pulseras)'}</span>
          </button>
        </div>
      </header>

      {/* Grid Dinamico de Tarjetas de Pulseras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {pulserasFiltradas.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-sm">
            Esperando telemetria de brazaletes para la sede seleccionada...
          </div>
        ) : (
          pulserasFiltradas.map((p) => (
            <div
              key={p.id_pulsera}
              className={`rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between relative overflow-hidden backdrop-blur-md ${
                p.alerta === 1
                  ? 'bg-rose-950/30 border-2 border-rose-500 animate-pulse shadow-lg shadow-rose-900/30'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header de la Tarjeta */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                  {p.id_pulsera}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    p.alerta === 1
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {p.alerta === 1 ? 'ALERTA' : 'NORMAL'}
                </span>
              </div>

              {/* Metricas Principales */}
              <div className="flex items-baseline justify-between mt-1 mb-2">
                <div>
                  <span className="text-3xl font-extrabold font-mono text-rose-400 tracking-tight">{p.bpm}</span>
                  <span className="text-[10px] font-semibold text-slate-400 ml-1">BPM</span>
                </div>
                <div className="text-right text-xs">
                  <div className="text-cyan-400 font-bold">{p.spo2}% <span className="text-slate-500 font-normal">SpO2</span></div>
                  <div className="text-amber-400 font-bold">{p.temp.toFixed(1)}°C</div>
                </div>
              </div>

              {/* Sparkline de Ritmo Cardiaco (Recharts) */}
              <div className="h-16 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={p.historialBpm}>
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      stroke={p.alerta === 1 ? '#ef4444' : '#f43f5e'}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Sync: {p.ultimaLectura}</span>
                <span>100Hz I2C</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardBiomedico;
