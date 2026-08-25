import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Sliders, 
  Zap, 
  Flame, 
  Droplet, 
  Activity, 
  Heart, 
  Ruler, 
  Weight, 
  Send
} from 'lucide-react';

interface SimulatorBarProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectData: (customData?: {
    mode?: string;
    temperature?: number;
    spo2?: number;
    heartRate?: number;
    distance?: number;
    weight?: number;
  }) => Promise<void>;
}

export const SimulatorBar: React.FC<SimulatorBarProps> = ({
  isOpen,
  onClose,
  onInjectData,
}) => {
  const [autoSimulating, setAutoSimulating] = useState(false);
  const [simSpeedMs, setSimSpeedMs] = useState(2000);
  const [temp, setTemp] = useState(36.6);
  const [spo2, setSpo2] = useState(98);
  const [heartRate, setHeartRate] = useState(74);
  const [distance, setDistance] = useState(172.0);
  const [weightVal, setWeightVal] = useState(68.2);

  // Auto simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoSimulating) {
      interval = setInterval(() => {
        // Small organic variance
        const variedTemp = +(temp + (Math.random() * 0.2 - 0.1)).toFixed(1);
        const variedSpo2 = Math.min(100, Math.max(80, spo2 + Math.floor(Math.random() * 2 - 1)));
        const variedHr = Math.round(heartRate + Math.floor(Math.random() * 4 - 2));
        const variedDist = +(distance + (Math.random() * 0.4 - 0.2)).toFixed(1);
        const variedWeight = +(weightVal + (Math.random() * 0.1 - 0.05)).toFixed(1);

        onInjectData({
          temperature: variedTemp,
          spo2: variedSpo2,
          heartRate: variedHr,
          distance: variedDist,
          weight: variedWeight,
        });
      }, simSpeedMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSimulating, simSpeedMs, temp, spo2, heartRate, distance, weightVal, onInjectData]);

  if (!isOpen) return null;

  const applyPreset = (mode: 'normal' | 'fever' | 'hypoxia' | 'workout') => {
    if (mode === 'normal') {
      setTemp(36.6);
      setSpo2(98);
      setHeartRate(72);
      setDistance(172.0);
      setWeightVal(68.2);
      onInjectData({ mode: 'normal', temperature: 36.6, spo2: 98, heartRate: 72, distance: 172.0, weight: 68.2 });
    } else if (mode === 'fever') {
      setTemp(38.8);
      setSpo2(96);
      setHeartRate(108);
      setDistance(172.0);
      setWeightVal(67.5);
      onInjectData({ mode: 'fever', temperature: 38.8, spo2: 96, heartRate: 108, distance: 172.0, weight: 67.5 });
    } else if (mode === 'hypoxia') {
      setTemp(36.2);
      setSpo2(91);
      setHeartRate(112);
      setDistance(172.0);
      setWeightVal(68.0);
      onInjectData({ mode: 'hypoxia', temperature: 36.2, spo2: 91, heartRate: 112, distance: 172.0, weight: 68.0 });
    } else if (mode === 'workout') {
      setTemp(37.4);
      setSpo2(99);
      setHeartRate(135);
      setDistance(175.0);
      setWeightVal(72.0);
      onInjectData({ mode: 'workout', temperature: 37.4, spo2: 99, heartRate: 135, distance: 175.0, weight: 72.0 });
    }
  };

  const handleManualSend = () => {
    onInjectData({
      temperature: temp,
      spo2,
      heartRate,
      distance,
      weight: weightVal,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="simulator-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl p-6 text-white space-y-5"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Simulasi Sensor ESP32-C3
              </h2>
              <p className="text-xs text-slate-400">
                Uji coba responsivitas visual dashboard sebelum perangkat fisik terhubung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Quick Scenario Presets */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Preset Skenario Cepat:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => applyPreset('normal')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/40 hover:border-emerald-700 border border-slate-700 text-xs font-medium text-slate-200 transition text-center"
            >
              🌿 Normal Sehat
            </button>
            <button
              onClick={() => applyPreset('fever')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-700 border border-slate-700 text-xs font-medium text-rose-300 transition text-center"
            >
              🔥 Demam (38.8°C)
            </button>
            <button
              onClick={() => applyPreset('hypoxia')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-950/40 hover:border-amber-700 border border-slate-700 text-xs font-medium text-amber-300 transition text-center"
            >
              ⚠️ Hipoksia (91%)
            </button>
            <button
              onClick={() => applyPreset('workout')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-cyan-950/40 hover:border-cyan-700 border border-slate-700 text-xs font-medium text-cyan-300 transition text-center"
            >
              🏃 Pasca Latihan
            </button>
          </div>
        </div>

        {/* Interactive Custom Sliders */}
        <div className="space-y-3.5 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          {/* Suhu */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="flex items-center gap-1 text-amber-300">
                <Flame className="w-3.5 h-3.5" /> Suhu Tubuh:
              </span>
              <span className="font-mono text-white font-bold">{temp}°C</span>
            </div>
            <input
              type="range"
              min="34.0"
              max="42.0"
              step="0.1"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* SpO2 */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="flex items-center gap-1 text-cyan-300">
                <Droplet className="w-3.5 h-3.5" /> SpO2 Oksigen:
              </span>
              <span className="font-mono text-white font-bold">{spo2}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="100"
              step="1"
              value={spo2}
              onChange={(e) => setSpo2(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Heart Rate */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="flex items-center gap-1 text-rose-300">
                <Heart className="w-3.5 h-3.5" /> Denyut Nadi:
              </span>
              <span className="font-mono text-white font-bold">{heartRate} BPM</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              step="1"
              value={heartRate}
              onChange={(e) => setHeartRate(parseInt(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Jarak / Tinggi */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="flex items-center gap-1 text-indigo-300">
                <Ruler className="w-3.5 h-3.5" /> Jarak / Tinggi:
              </span>
              <span className="font-mono text-white font-bold">{distance} cm</span>
            </div>
            <input
              type="range"
              min="50"
              max="220"
              step="0.5"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Berat */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="flex items-center gap-1 text-emerald-300">
                <Weight className="w-3.5 h-3.5" /> Berat Badan:
              </span>
              <span className="font-mono text-white font-bold">{weightVal} kg</span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              step="0.5"
              value={weightVal}
              onChange={(e) => setWeightVal(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Continuous Auto Stream Toggle */}
          <button
            id="btn-toggle-auto-stream"
            onClick={() => setAutoSimulating(!autoSimulating)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
              autoSimulating
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {autoSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{autoSimulating ? 'Hentikan Auto-Stream' : 'Jalankan Auto-Stream'}</span>
          </button>

          {/* Single Inject Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-inject-single-packet"
              onClick={handleManualSend}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim 1x Paket</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
