import React, { useState } from 'react';
import { 
  Thermometer, 
  Heart, 
  Ruler, 
  Weight as ScaleIcon, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Flame,
  Droplet,
  Zap,
  Info,
  Search
} from 'lucide-react';
import { SensorData, HealthAssessment } from '../types';
import { evaluateHealthMetrics } from '../utils/healthCalculations';

interface VitalsGaugesProps {
  latestData: SensorData | null;
  history: SensorData[];
  onTriggerZeroTare?: () => void;
}

export const VitalsGauges: React.FC<VitalsGaugesProps> = ({
  latestData,
  history,
}) => {
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [distMode, setDistMode] = useState<'height' | 'raw'>('height');

  // Fallback defaults if no data yet
  const current: SensorData = latestData || {
    id: 'placeholder',
    timestamp: new Date().toISOString(),
    deviceId: 'ESP32-C3',
    temperature: 36.6,
    spo2: 98,
    heartRate: 72,
    distance: 172.0,
    weight: 68.5,
    battery: 100,
    rssi: -55,
  };

  const assessment: HealthAssessment = evaluateHealthMetrics(current);

  // Compute session min/max
  const tempValues = history.map((d) => d.temperature);
  const minTemp = tempValues.length > 0 ? Math.min(...tempValues) : current.temperature;
  const maxTemp = tempValues.length > 0 ? Math.max(...tempValues) : current.temperature;

  const spo2Values = history.map((d) => d.spo2);
  const minSpo2 = spo2Values.length > 0 ? Math.min(...spo2Values) : current.spo2;

  const hrValues = history.map((d) => d.heartRate);
  const minHr = hrValues.length > 0 ? Math.min(...hrValues) : current.heartRate;
  const maxHr = hrValues.length > 0 ? Math.max(...hrValues) : current.heartRate;

  // Temperature display value
  const displayTemp = tempUnit === 'C' 
    ? current.temperature.toFixed(1)
    : ((current.temperature * 9) / 5 + 32).toFixed(1);

  // Weight display value
  const displayWeight = weightUnit === 'kg'
    ? current.weight.toFixed(2)
    : (current.weight * 2.20462).toFixed(2);

  // Pulse animation speed
  const pulseDurationSec = Math.max(0.35, +(60 / Math.max(40, current.heartRate)).toFixed(2));

  return (
    <section id="vitals-dashboard-section" className="space-y-6">
      {/* Risk Alert Banner if any parameter is critical */}
      {assessment.overallRisk !== 'Sehat' && (
        <div 
          id="vital-alert-banner"
          className={`px-5 py-3.5 rounded-3xl border flex items-center justify-between text-sm transition-all shadow-xl backdrop-blur-sm ${
            assessment.overallRisk === 'Bahaya' 
              ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
              : assessment.overallRisk === 'Waspada'
              ? 'bg-amber-950/50 border-amber-800/80 text-amber-200'
              : 'bg-blue-950/50 border-blue-800/80 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <div>
              <span className="font-semibold uppercase tracking-wider text-xs mr-2 px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700">
                {assessment.overallRisk}
              </span>
              {assessment.temperatureStatus !== 'Normal' && `Suhu tubuh ${assessment.temperatureStatus}. `}
              {assessment.spo2Status !== 'Normal' && `Saturasi O2 ${assessment.spo2Status}. `}
              {assessment.heartRateStatus !== 'Normal' && `Denyut nadi ${assessment.heartRateStatus}. `}
              {assessment.bmiCategory !== 'Normal' && `Kategori BMI: ${assessment.bmiCategory}.`}
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-mono hidden sm:inline-block">
            Auto-Evaluated
          </span>
        </div>
      )}

      {/* 4 Sensor Gauges Grid (Sleek Interface Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* CARD 1: OXIMETER (SpO2 & PULSE) - Span 4 on Large */}
        <div 
          id="card-sensor-oxymeter"
          className="lg:col-span-4 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-600 transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 shadow-inner">
              <Heart 
                className="w-6 h-6 text-rose-400 animate-pulse" 
                style={{ animationDuration: `${pulseDurationSec}s` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Oximeter
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                assessment.spo2Status === 'Normal'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {assessment.spo2Status}
              </span>
            </div>
          </div>

          <div className="mt-5 mb-3">
            <div className="text-5xl sm:text-6xl font-bold text-white flex items-baseline gap-1 font-mono tracking-tight">
              {current.spo2} <span className="text-xl sm:text-2xl text-slate-500 font-sans">%</span>
            </div>
            <div className="text-sm text-slate-400 font-medium mt-1">SpO2 Saturation (MAX30102)</div>
          </div>

          {/* Heart Rate & Waveform Equalizer */}
          <div className="mt-4 border-t border-slate-700/50 pt-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-rose-400 font-mono flex items-baseline gap-1">
                {current.heartRate} <span className="text-xs text-slate-400 uppercase tracking-widest font-sans font-bold">bpm</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Min: {minHr} • Max: {maxHr}
              </div>
            </div>

            {/* Heartbeat Rhythm Visualizer Equalizer */}
            <div className="flex gap-1.5 items-end h-8">
              <div className="w-1.5 bg-rose-500/40 h-4 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 bg-rose-500/60 h-6 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 bg-rose-500/80 h-3 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-1.5 bg-rose-500 h-8 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <div className="w-1.5 bg-rose-500/70 h-5 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>

        {/* CARD 2: AMBIENT TEMPERATURE (DS18B20/MLX) - Span 8 on Large */}
        <div 
          id="card-sensor-temperature"
          className="lg:col-span-8 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-sm group hover:border-slate-600 transition-all duration-300"
        >
          {/* Realtime Heatmap & Unit Button Badge */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                Ambient Temperature / Suhu
              </p>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Sensor: DS18B20 / MLX90614 (1-Wire)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-switch-temp-unit"
                onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
              >
                °{tempUnit}
              </button>
              <div className="bg-orange-500/20 text-orange-400 px-3 sm:px-4 py-1 rounded-full text-xs font-bold uppercase tracking-tighter border border-orange-500/30 shadow-sm">
                Realtime Heatmap
              </div>
            </div>
          </div>

          {/* Huge Number Display */}
          <div className="my-2 sm:my-4">
            <div className="text-6xl sm:text-7xl lg:text-[80px] leading-none font-extrabold text-white tracking-tighter flex items-start font-mono">
              {displayTemp} <span className="text-3xl sm:text-4xl mt-2 sm:mt-3 text-orange-400 font-sans ml-1">°{tempUnit}</span>
            </div>
          </div>

          {/* Temperature Range Bar & Scale */}
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ 
                    width: `${Math.min(100, Math.max(12, ((current.temperature - 30) / (42 - 30)) * 100))}%` 
                  }}
                />
              </div>
              <div className="text-slate-400 text-xs font-mono whitespace-nowrap">
                Range: 34°C - 42°C
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Status: <strong className="text-slate-200">{assessment.temperatureStatus}</strong></span>
              <span>Min: {minTemp.toFixed(1)}°C • Max: {maxTemp.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* CARD 3: ULTRASONIC DISTANCE (HC-SR04) - Span 6 on Large */}
        <div 
          id="card-sensor-distance"
          className="lg:col-span-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-sm relative group hover:border-slate-600 transition-all duration-300"
        >
          <div>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                  {distMode === 'height' ? 'Ultrasonic Height' : 'Ultrasonic Distance'}
                </h3>
                <button
                  id="btn-switch-dist-mode"
                  onClick={() => setDistMode(distMode === 'height' ? 'raw' : 'height')}
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg bg-slate-900/80 text-cyan-400 border border-slate-700 hover:bg-slate-700 transition"
                >
                  {distMode === 'height' ? 'Tinggi' : 'Jarak'}
                </button>
              </div>
              <div className="text-cyan-400 text-xs font-mono font-semibold">
                Accuracy ±0.1cm
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 sm:gap-8">
              <div className="flex-1">
                <div className="text-5xl sm:text-6xl font-bold text-white mb-2 font-mono tracking-tight">
                  {current.distance.toFixed(1)} <span className="text-xl sm:text-2xl text-slate-500 font-sans">cm</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Object detected within active sensor range
                </p>
                <div className="text-xs text-indigo-300 font-mono mt-2 flex items-center gap-2">
                  <span>{(current.distance / 100).toFixed(2)} m</span>
                  <span className="text-slate-600">•</span>
                  <span>{Math.floor(current.distance / 30.48)} ft {Math.round((current.distance % 30.48) / 2.54)} in</span>
                </div>
              </div>

              {/* Radar Circle Icon Visualizer */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-700 flex items-center justify-center relative flex-shrink-0 bg-slate-900/60 shadow-inner">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent border-r-transparent animate-spin" style={{ animationDuration: '6s' }} />
                <Ruler className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-700/40 flex justify-between text-xs text-slate-400 font-mono">
            <span>Ultrasonic Echo Pulse</span>
            <span className="text-cyan-300">Transit: {(current.distance * 58.2).toFixed(0)} µs</span>
          </div>
        </div>

        {/* CARD 4: LOAD CELL / WEIGHT & BMI (HX711) - Span 6 on Large */}
        <div 
          id="card-sensor-weight"
          className="lg:col-span-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-600 transition-all duration-300"
        >
          {/* Subtle glowing radial blur backdrop */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                  Load Cell / Weight
                </h3>
                <button
                  id="btn-switch-weight-unit"
                  onClick={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
                >
                  {weightUnit.toUpperCase()}
                </button>
              </div>

              {/* Huge Bold Italic Weight */}
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-white italic tracking-tighter font-mono">
                {displayWeight} <span className="text-2xl sm:text-3xl text-indigo-400 not-italic uppercase font-sans font-extrabold">{weightUnit}</span>
              </div>
            </div>

            {/* Status Info Grid Box */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5">
              <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                  BMI Calculated
                </div>
                <div className="text-sm sm:text-base font-mono font-bold text-emerald-400">
                  {assessment.bmi} <span className="text-[11px] text-slate-400 font-normal">({assessment.bmiCategory})</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                  Load Status
                </div>
                <div className="text-sm sm:text-base font-bold text-indigo-400 uppercase tracking-wider font-mono">
                  {current.weight > 5 ? 'STABLE LOAD' : 'TARED / ZERO'}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
