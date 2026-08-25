import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Cpu, 
  Sparkles, 
  Sliders, 
  Code2, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { SensorData } from '../types';

interface HeaderProps {
  latestData: SensorData | null;
  isConnected: boolean;
  isStreaming: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHardwareModal: () => void;
  onOpenSimulator: () => void;
  onOpenAiAnalysis: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  latestData,
  isConnected,
  isStreaming,
  soundEnabled,
  onToggleSound,
  onOpenHardwareModal,
  onOpenSimulator,
  onOpenAiAnalysis,
  onRefresh,
  isRefreshing,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="main-header" className="bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          
          {/* Left: Device & Title */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-baseline gap-2">
                IoT Dashboard <span className="text-cyan-400 font-light text-xl sm:text-2xl">v2.4</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center mt-2 gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
                Device: <span className="text-slate-200 font-mono">{latestData?.deviceId || 'ESP32-C3'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                Cloud: <span className="text-slate-200">{isConnected ? 'Connected (Global)' : 'Reconnecting...'}</span>
              </div>
              {latestData?.rssi && (
                <div className="text-xs uppercase tracking-widest text-slate-500 font-mono hidden sm:inline-block">
                  RSSI: {latestData.rssi} dBm
                </div>
              )}
            </div>
          </div>

          {/* Right: Realtime Digital Clock, Access Badge & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4">
            
            {/* Clock & Access Tier */}
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-slate-200">
                {currentTime || '14:42:09'}
              </div>
              <div className="text-[11px] text-cyan-400 uppercase tracking-widest font-bold mt-0.5">
                Access: Community Free Tier
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center flex-wrap gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              
              {/* Sound Toggle */}
              <button
                id="btn-toggle-sound"
                onClick={onToggleSound}
                title={soundEnabled ? 'Matikan Suara Alarm & Detak' : 'Aktifkan Suara Alarm & Detak'}
                className={`p-2.5 rounded-2xl border transition-all ${
                  soundEnabled 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700/80'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Refresh Data */}
              <button
                id="btn-refresh-data"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Manual Data"
                className="p-2.5 rounded-2xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>

              {/* Simulator Button */}
              <button
                id="btn-open-simulator"
                onClick={onOpenSimulator}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 transition-all shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulasi Sensor</span>
              </button>

              {/* AI Health Assist */}
              <button
                id="btn-open-ai-analysis"
                onClick={onOpenAiAnalysis}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/25"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>AI Health Assist</span>
              </button>

              {/* Wiring & Arduino Code */}
              <button
                id="btn-open-hardware-code"
                onClick={onOpenHardwareModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-600/25"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-100" />
                <span>ESP32 Wiring</span>
              </button>

            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
