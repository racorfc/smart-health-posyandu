import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ListChecks, 
  RotateCcw,
  Stethoscope
} from 'lucide-react';
import { SensorData, GeminiAnalysisResult } from '../types';

interface GeminiHealthAiProps {
  latestData: SensorData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiHealthAi: React.FC<GeminiHealthAiProps> = ({
  latestData,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const runAnalysis = async () => {
    if (!latestData) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: latestData.temperature,
          spo2: latestData.spo2,
          heartRate: latestData.heartRate,
          distance: latestData.distance,
          weight: latestData.weight,
          language: 'id',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data: GeminiAnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Failed to run AI assessment:', err);
      setError('Gagal menghubungkan ke modul AI Gemini. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="ai-analysis-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white space-y-5"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Analisis Medis Cerdas (Gemini 3.7)
              </h2>
              <p className="text-xs text-slate-400">
                Interpretasi klinis otomatis berdasarkan telemetri sensor ESP32-C3
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

        {/* Current Sensor Snapshot */}
        <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            Snapshot Nilai Sensor Terkini:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">Suhu</span>
              <span className="font-bold text-amber-300 font-mono text-sm">
                {latestData?.temperature || 36.5}°C
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">SpO2</span>
              <span className="font-bold text-cyan-300 font-mono text-sm">
                {latestData?.spo2 || 98}%
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">Nadi</span>
              <span className="font-bold text-rose-300 font-mono text-sm">
                {latestData?.heartRate || 75} BPM
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">Tinggi</span>
              <span className="font-bold text-indigo-300 font-mono text-sm">
                {latestData?.distance || 170} cm
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">Berat</span>
              <span className="font-bold text-emerald-300 font-mono text-sm">
                {latestData?.weight || 65} kg
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!result && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-300 mb-4">
              Klik tombol di bawah untuk meminta AI mengevaluasi korelasi tanda vital dan memberikan panduan kesehatan.
            </p>
            <button
              id="btn-run-ai-diagnosis"
              onClick={runAnalysis}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Mulai Analisis Medis AI Sekarang</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 animate-spin">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              Gemini sedang memproses data telemetri...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mengevaluasi parameter suhu, saturasi hemoglobin, ritme denyut, dan komposisi BMI
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>{error}</div>
          </div>
        )}

        {/* AI Result View */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Risk Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH'
                ? 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                : result.riskLevel === 'MODERATE'
                ? 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
            }`}>
              {result.riskLevel === 'LOW' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Status Risiko: {result.riskLevel}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 font-mono">
                    {new Date(result.analyzedAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-200">{result.summary}</p>
              </div>
            </div>

            {/* Vital Signs Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 font-medium block mb-1">🌡️ Suhu Tubuh:</span>
                <span className="text-slate-200 font-semibold">{result.vitalStatus.temperature}</span>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 font-medium block mb-1">🫁 Oksigenasi (SpO2):</span>
                <span className="text-slate-200 font-semibold">{result.vitalStatus.oxygenation}</span>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 font-medium block mb-1">❤️ Kardiovaskular (Nadi):</span>
                <span className="text-slate-200 font-semibold">{result.vitalStatus.cardiovascular}</span>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 font-medium block mb-1">⚖️ Komposisi Tubuh (BMI):</span>
                <span className="text-slate-200 font-semibold">{result.vitalStatus.bodyComposition}</span>
              </div>
            </div>

            {/* Clinical Interpretation */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/40 text-xs space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-purple-400" />
                Interpretasi Klinis:
              </div>
              <p className="text-slate-300 leading-relaxed">
                {result.clinicalInterpretation}
              </p>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/40 text-xs space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                Rekomendasi & Tindakan Praktis:
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>

            {/* Refresh Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={runAnalysis}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Analisis Ulang</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
