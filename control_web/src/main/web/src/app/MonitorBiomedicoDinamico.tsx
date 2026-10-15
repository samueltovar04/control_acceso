import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export interface TelemetriaItem {
  id_pulsera: string;
  bpm: number;
  spo2: number;
  temp: number;
  estado_alerta?: number;
  alerta?: number;
  timestamp?: string;
}

interface HistorialPunto {
  time: string;
  bpm: number;
}

interface DispositivoDinamico {
  id_pulsera: string;
  bpm: number;
  spo2: number;
  temp: number;
  alerta: number;
  historialBpm: HistorialPunto[];
  ultimaLectura: string;
  lastTimestamp: number;
}

const POOL_DISPOSITIVOS = Array.from({ length: 20 }, (_, i) => `PULSERA_${String(i + 1).padStart(3, '0')}`);
const INACTIVITY_THRESHOLD_MS = 10000;

export const MonitorBiomedicoDinamico: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<Map<string, DispositivoDinamico>>(new Map());
  const [wsConectado, setWsConectado] = useState<boolean>(false);
  const [emuladorActivo, setEmuladorActivo] = useState<boolean>(false);
  
  const poolActivoRef = useRef<string[]>(["PULSERA_001", "PULSERA_002", "PULSERA_003"]);
  const emuTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket Connection
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

  // Garbage collector de pulseras desconectadas / inactivas
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setDispositivos((prev) => {
        let modificado = false;
        const next = new Map(prev);

        for (const [id, dev] of next.entries()) {
          if (now - dev.lastTimestamp > INACTIVITY_THRESHOLD_MS) {
            next.delete(id);
            modificado = true;
          }
        }
        return modificado ? next : prev;
      });
    }, 2000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const procesarLectura = (item: TelemetriaItem) => {
    const now = Date.now();
    const hora = new Date().toTimeString().split(' ')[0];
    const alertaVal = item.estado_alerta !== undefined ? item.estado_alerta : (item.alerta || 0);

    setDispositivos((prev) => {
      const next = new Map(prev);
      const actual = next.get(item.id_pulsera);

      const historialPrev = actual ? actual.historialBpm : [];
      const nuevoHistorial = [...historialPrev.slice(-15), { time: hora, bpm: item.bpm }];

      next.set(item.id_pulsera, {
        id_pulsera: item.id_pulsera,
        bpm: item.bpm,
        spo2: item.spo2,
        temp: item.temp,
        alerta: alertaVal,
        historialBpm: nuevoHistorial,
        ultimaLectura: hora,
        lastTimestamp: now
      });

      return next;
    });
  };

  // Emulador dinamico con altas y desconexiones
  const toggleEmulador = () => {
    if (emuladorActivo) {
      if (emuTimerRef.current) clearInterval(emuTimerRef.current);
      emuTimerRef.current = null;
      setEmuladorActivo(false);
    } else {
      setEmuladorActivo(true);
      emuTimerRef.current = setInterval(async () => {
        // Dinamica de desconexion de pulsera (excepto 001 y 002)
        if (Math.random() < 0.15 && poolActivoRef.current.length > 2) {
          const idx = poolActivoRef.current.findIndex(p => p !== 'PULSERA_001' && p !== 'PULSERA_002');
          if (idx !== -1) {
            poolActivoRef.current.splice(idx, 1);
          }
        }
        // Dinamica de conexion de nueva pulsera
        if (Math.random() < 0.25 && poolActivoRef.current.length < 15) {
          const nueva = POOL_DISPOSITIVOS[Math.floor(Math.random() * POOL_DISPOSITIVOS.length)];
          if (!poolActivoRef.current.includes(nueva)) {
            poolActivoRef.current.push(nueva);
          }
        }

        if (poolActivoRef.current.length === 0) return;

        // Alternar para garantizar que PULSERA_001 y PULSERA_002 esten siempre activas
        const rndFija = Math.random();
        let id: string;
        if (rndFija < 0.4) {
          id = 'PULSERA_001';
        } else if (rndFija < 0.8) {
          id = 'PULSERA_002';
        } else {
          id = poolActivoRef.current[Math.floor(Math.random() * poolActivoRef.current.length)];
        }
        const rnd = Math.random();

        let bpm = Math.floor(66 + Math.random() * 20);
        let spo2 = Math.floor(96 + Math.random() * 4);
        let temp = parseFloat((36.2 + Math.random() * 0.7).toFixed(2));
        let alerta = 0;

        if (rnd < 0.12) {
          bpm = 158;
          alerta = 1;
        } else if (rnd < 0.20) {
          spo2 = 87;
          alerta = 1;
        }

        const payload: TelemetriaItem = {
          id_pulsera: id,
          bpm,
          spo2,
          temp,
          estado_alerta: alerta
        };

        try {
          await fetch('/api/v1/telemetria/gateway-ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch {
          procesarLectura(payload);
        }
      }, 850);
    }
  };

  const listaDispositivos = Array.from(dispositivos.values());
  const totalAlertas = listaDispositivos.filter(d => d.alerta === 1).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6 selection:bg-rose-500">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-950/40">
            BT
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Panel de Monitoreo Dinámico de Pulseras
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-900 border border-slate-700 text-slate-300">
                React.js + Tailwind CSS + Recharts
              </span>
            </h1>
            <p className="text-xs text-slate-400">Detección automática de conexiones, desconexiones y telemetría reactiva Quarkus</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConectado ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-slate-300">{wsConectado ? 'WebSocket Quarkus Activo' : 'Desconectado'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <span className="text-slate-400">En Línea:</span>
            <span className="text-cyan-400 font-bold font-mono">{listaDispositivos.length}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <span className="text-slate-400">Alertas:</span>
            <span className={totalAlertas > 0 ? 'text-rose-400 font-bold font-mono' : 'text-emerald-400 font-bold font-mono'}>
              {totalAlertas}
            </span>
          </div>

          <button
            onClick={toggleEmulador}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 ${
              emuladorActivo
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
            }`}
          >
            <span>{emuladorActivo ? '⏸ Detener Emulador' : '▶ Emular Gateway Dinámico'}</span>
          </button>
        </div>
      </header>

      {/* Vista Vacia si no hay dispositivos conectados */}
      {listaDispositivos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xl">
            IoT
          </div>
          <h3 className="text-slate-300 font-semibold text-base">Sin brazaletes activos en el área</h3>
          <p className="text-slate-500 text-xs max-w-md">
            El sistema detecta automáticamente cuando una pulsera comienza o deja de emitir por ESP-NOW hacia el Gateway.
          </p>
        </div>
      ) : (
        /* Grid Dinamico de Tarjetas de Pulseras */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {listaDispositivos.map((d) => (
            <div
              key={d.id_pulsera}
              className={`rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between relative overflow-hidden backdrop-blur-md ${
                d.alerta === 1
                  ? 'bg-rose-950/30 border-2 border-rose-500 animate-pulse shadow-lg shadow-rose-900/30'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header de Tarjeta */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {d.id_pulsera}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    d.alerta === 1
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {d.alerta === 1 ? 'ALERTA' : 'NORMAL'}
                </span>
              </div>

              {/* Metricas */}
              <div className="flex items-baseline justify-between mt-1 mb-2">
                <div>
                  <span className="text-3xl font-extrabold font-mono text-rose-400 tracking-tight">{d.bpm}</span>
                  <span className="text-[10px] font-semibold text-slate-400 ml-1">BPM</span>
                </div>
                <div className="text-right text-xs">
                  <div className="text-cyan-400 font-bold">{d.spo2}% <span className="text-slate-500 font-normal">SpO2</span></div>
                  <div className="text-amber-400 font-bold">{d.temp.toFixed(1)}°C</div>
                </div>
              </div>

              {/* Sparkline Recharts */}
              <div className="h-16 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.historialBpm}>
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      stroke={d.alerta === 1 ? '#ef4444' : '#f43f5e'}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Sync: {d.ultimaLectura}</span>
                <span className="text-emerald-400">● Conectado</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitorBiomedicoDinamico;
