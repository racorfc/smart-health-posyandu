import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SensorData } from './types';
import { Header } from './components/Header';
import { VitalsGauges } from './components/VitalsGauges';
import { LiveTelemetryChart } from './components/LiveTelemetryChart';
import { GeminiHealthAi } from './components/GeminiHealthAi';
import { HardwareHubModal } from './components/HardwareHubModal';
import { SimulatorBar } from './components/SimulatorBar';
import { HistoryTable } from './components/HistoryTable';
import { playHeartbeatTone, playAlertAlarm } from './utils/audio';
import { 
  Activity, 
  Wifi, 
  Cpu, 
  Info, 
  Sparkles, 
  Globe, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [history, setHistory] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const prevHeartbeatRef = useRef<number>(0);

  // Fetch initial history & continuous polling
  const fetchTelemetry = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
          setHistory(data.records);
          setLatestData(data.records[data.records.length - 1]);
          setIsConnected(true);
        } else if (data.latest) {
          setLatestData(data.latest);
          setHistory((prev) => [...prev.slice(-199), data.latest]);
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry(true);
    const interval = setInterval(() => {
      fetchTelemetry(false);
    }, 1500);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Real-time SSE Connection (Optional accelerator)
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/telemetry/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
          setIsStreaming(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const newReading: SensorData = JSON.parse(event.data);
            setLatestData(newReading);
            setIsConnected(true);

            setHistory((prev) => {
              const existsIndex = prev.findIndex((item) => item.id === newReading.id || (item.timestamp === newReading.timestamp && item.deviceId === newReading.deviceId));
              let next: SensorData[];
              if (existsIndex >= 0) {
                next = [...prev];
                next[existsIndex] = newReading;
              } else {
                next = [...prev, newReading];
              }
              if (next.length > 200) {
                return next.slice(-200);
              }
              return next;
            });

            // Sound triggers
            if (soundEnabled) {
              const now = Date.now();
              if (now - prevHeartbeatRef.current > 700) {
                playHeartbeatTone(newReading.heartRate);
                prevHeartbeatRef.current = now;
              }

              if (newReading.temperature > 38.5 || newReading.spo2 < 92) {
                playAlertAlarm();
              }
            }
          } catch (err) {
            console.error('Failed to parse SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          setIsStreaming(false);
          if (eventSource) {
            eventSource.close();
          }
          setTimeout(setupSSE, 8000);
        };
      } catch (e) {
        // SSE not supported or unavailable
      }
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [soundEnabled]);

  // Inject simulation data
  const handleInjectData = async (customData?: {
    mode?: string;
    temperature?: number;
    spo2?: number;
    heartRate?: number;
    distance?: number;
    weight?: number;
  }) => {
    try {
      const res = await fetch('/api/telemetry/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customData || {}),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.reading) {
          setLatestData(result.reading);
          setHistory((prev) => [...prev.slice(-199), result.reading]);
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.error('Failed to inject simulation packet:', err);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    try {
      await fetch('/api/telemetry/history', { method: 'DELETE' });
      fetchTelemetry();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navigation & Status Bar */}
      <Header
        latestData={latestData}
        isConnected={isConnected}
        isStreaming={isStreaming}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenAiAnalysis={() => setIsAiModalOpen(true)}
        onRefresh={fetchTelemetry}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        
        {/* Real-time Hero Banner */}
        <section id="hero-kiosk-intro" className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Konektivitas Internet Global & Bebas Akses</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Monitoring Telemetri Pasien & Fisik ESP32-C3
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Platform telemetri multi-sensor real-time berbasis ESP32-C3. Menampilkan suhu tubuh kontinu, saturasi oksigen darah (SpO2), detak nadi oximeter, tinggi/jarak ultrasonik, dan beban timbangan load cell melalui koneksi internet nirkabel.
              </p>
            </div>

            {/* Quick Specs Pills */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700/50 font-mono shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Oximeter MAX30102 (I2C)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700/50 font-mono shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Suhu DS18B20 / MLX (1-Wire)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700/50 font-mono shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Jarak HC-SR04 & Berat HX711</span>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Core 4 Vitals Gauges */}
        <VitalsGauges
          latestData={latestData}
          history={history}
        />

        {/* 2. Real-Time Telemetry Multi-Line Chart */}
        <LiveTelemetryChart
          data={history}
          isStreaming={isStreaming}
        />

        {/* 3. History Logs & Export */}
        <HistoryTable
          records={history}
          onClearHistory={handleClearHistory}
        />

      </main>

      {/* Sleek Interface Footer */}
      <footer className="mt-8 pt-6 pb-8 border-t border-slate-800/80 bg-[#0B1120] text-[11px] uppercase tracking-[0.2em] text-slate-400 font-bold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Network Latency: 38ms (Global Live)</span>
          </div>
          <div>Node: ESP32C3-GLOBAL-GATEWAY</div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsHardwareModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              ESP32 Code
            </button>
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="text-purple-400 hover:text-purple-300 transition"
            >
              Gemini AI
            </button>
            <span>Status: 100% Operational</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HardwareHubModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      <SimulatorBar
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onInjectData={handleInjectData}
      />

      <GeminiHealthAi
        latestData={latestData}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

    </div>
  );
}
