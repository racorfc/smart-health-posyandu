import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { SensorData } from '../types';
import { 
  TrendingUp, 
  Activity, 
  Eye, 
  EyeOff, 
  Clock, 
  Layers 
} from 'lucide-react';

interface LiveTelemetryChartProps {
  data: SensorData[];
  isStreaming: boolean;
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({
  data,
  isStreaming,
}) => {
  const [timeWindow, setTimeWindow] = useState<'1m' | '5m' | '15m' | 'all'>('5m');
  const [visibleSeries, setVisibleSeries] = useState({
    temperature: true,
    spo2: true,
    heartRate: true,
    distance: false,
    weight: false,
  });

  // Filter data based on time window
  const now = Date.now();
  const filteredData = data.filter((item) => {
    if (timeWindow === 'all') return true;
    const itemTime = new Date(item.timestamp).getTime();
    if (timeWindow === '1m') return now - itemTime <= 60 * 1000;
    if (timeWindow === '5m') return now - itemTime <= 5 * 60 * 1000;
    if (timeWindow === '15m') return now - itemTime <= 15 * 60 * 1000;
    return true;
  });

  // Prepare chart format
  const chartData = filteredData.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    temperature: d.temperature,
    spo2: d.spo2,
    heartRate: d.heartRate,
    distance: d.distance,
    weight: d.weight,
    rawTimestamp: d.timestamp,
  }));

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section id="chart-section" className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-700/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Grafik Telemetri Real-Time
                </h2>
                {isStreaming && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Feed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sinkronisasi data multi-channel ESP32-C3 ({chartData.length} data point)
              </p>
            </div>
          </div>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/60 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          <button
            id="time-filter-1m"
            onClick={() => setTimeWindow('1m')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              timeWindow === '1m'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1m
          </button>
          <button
            id="time-filter-5m"
            onClick={() => setTimeWindow('5m')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              timeWindow === '5m'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5m
          </button>
          <button
            id="time-filter-15m"
            onClick={() => setTimeWindow('15m')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              timeWindow === '15m'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            15m
          </button>
          <button
            id="time-filter-all"
            onClick={() => setTimeWindow('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              timeWindow === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Series Toggle Pills */}
      <div className="flex flex-wrap items-center gap-2 my-4">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mr-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" /> Sensor:
        </span>
        
        {/* Suhu */}
        <button
          id="toggle-series-temp"
          onClick={() => toggleSeries('temperature')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
            visibleSeries.temperature
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {visibleSeries.temperature ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Suhu (°C)</span>
        </button>

        {/* SpO2 */}
        <button
          id="toggle-series-spo2"
          onClick={() => toggleSeries('spo2')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
            visibleSeries.spo2
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {visibleSeries.spo2 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>SpO2 (%)</span>
        </button>

        {/* Heart Rate */}
        <button
          id="toggle-series-heart"
          onClick={() => toggleSeries('heartRate')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
            visibleSeries.heartRate
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {visibleSeries.heartRate ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Nadi (BPM)</span>
        </button>

        {/* Jarak */}
        <button
          id="toggle-series-dist"
          onClick={() => toggleSeries('distance')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
            visibleSeries.distance
              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-sm'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {visibleSeries.distance ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>Jarak (cm)</span>
        </button>

        {/* Berat */}
        <button
          id="toggle-series-weight"
          onClick={() => toggleSeries('weight')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
            visibleSeries.weight
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {visibleSeries.weight ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Berat (kg)</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm font-mono">
            Belum ada data telemetri pada rentang waktu ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(51, 65, 85, 0.6)',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />

              {visibleSeries.temperature && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Suhu Tubuh (°C)"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#fbbf24' }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              )}

              {visibleSeries.spo2 && (
                <Line
                  type="monotone"
                  dataKey="spo2"
                  name="SpO2 (%)"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#22d3ee' }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              )}

              {visibleSeries.heartRate && (
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Denyut Nadi (BPM)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#f43f5e' }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              )}

              {visibleSeries.distance && (
                <Line
                  type="monotone"
                  dataKey="distance"
                  name="Jarak (cm)"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ r: 1.5, fill: '#818cf8' }}
                  isAnimationActive={false}
                />
              )}

              {visibleSeries.weight && (
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Berat (kg)"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 1.5, fill: '#34d399' }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
