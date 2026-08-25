import React, { useState } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  Filter, 
  Search,
  FileSpreadsheet,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { SensorData } from '../types';

interface HistoryTableProps {
  records: SensorData[];
  onClearHistory: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAbnormalOnly, setFilterAbnormalOnly] = useState(false);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const isAbnormal = r.temperature > 37.5 || r.spo2 < 95 || r.heartRate > 100 || r.heartRate < 60;
    if (filterAbnormalOnly && !isAbnormal) return false;
    if (!searchTerm) return true;
    return (
      r.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.temperature.toString().includes(searchTerm) ||
      r.spo2.toString().includes(searchTerm)
    );
  });

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Waktu', 'Device ID', 'Suhu (°C)', 'SpO2 (%)', 'Nadi (BPM)', 'Jarak (cm)', 'Berat (kg)', 'Baterai (%)', 'RSSI (dBm)'];
    const rows = records.map((r) => [
      new Date(r.timestamp).toLocaleString(),
      r.deviceId,
      r.temperature,
      r.spo2,
      r.heartRate,
      r.distance,
      r.weight,
      r.battery || 100,
      r.rssi || -60,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `esp32c3_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (records.length === 0) return;
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `esp32c3_telemetry_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="history-section" className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Log Riwayat Data Telemetri
            </h2>
            <p className="text-xs text-slate-400">
              Total {records.length} data point tercatat dari sensor ESP32-C3
            </p>
          </div>
        </div>

        {/* Action Buttons: Export & Clear */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            id="btn-export-json"
            onClick={exportJSON}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-semibold transition disabled:opacity-40"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>

          <button
            id="btn-clear-history"
            onClick={onClearHistory}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:border-rose-700 border border-slate-700 text-slate-400 hover:text-rose-300 text-xs transition"
            title="Hapus / Reset Riwayat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari device / nilai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-2xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <button
          onClick={() => setFilterAbnormalOnly(!filterAbnormalOnly)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition ${
            filterAbnormalOnly
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
              : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Hanya Anomali / Peringatan</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-700/50 uppercase tracking-wider text-[10px] font-bold">
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Perangkat</th>
              <th className="py-3 px-4">Suhu (°C)</th>
              <th className="py-3 px-4">SpO2 (%)</th>
              <th className="py-3 px-4">Nadi (BPM)</th>
              <th className="py-3 px-4">Jarak (cm)</th>
              <th className="py-3 px-4">Berat (kg)</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 bg-slate-900/40">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                  Tidak ada catatan telemetri yang cocok.
                </td>
              </tr>
            ) : (
              filteredRecords.slice(-15).reverse().map((r, idx) => {
                const isFever = r.temperature > 37.5;
                const isHypoxia = r.spo2 < 95;
                const isFastPulse = r.heartRate > 100;
                const hasAlert = isFever || isHypoxia || isFastPulse;

                return (
                  <tr key={`${r.id || 'row'}-${r.timestamp}-${idx}`} className="hover:bg-slate-800/60 transition">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-4 text-cyan-400 text-[11px] font-semibold">
                      {r.deviceId}
                    </td>
                    <td className={`py-2.5 px-4 font-semibold ${isFever ? 'text-rose-400' : 'text-amber-300'}`}>
                      {r.temperature.toFixed(1)}
                    </td>
                    <td className={`py-2.5 px-4 font-semibold ${isHypoxia ? 'text-rose-400' : 'text-cyan-300'}`}>
                      {r.spo2}%
                    </td>
                    <td className={`py-2.5 px-4 font-semibold ${isFastPulse ? 'text-rose-400' : 'text-rose-300'}`}>
                      {r.heartRate}
                    </td>
                    <td className="py-2.5 px-4 text-indigo-300">
                      {r.distance.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-300">
                      {r.weight.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      {hasAlert ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-2.5 h-2.5" /> Peringatan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
