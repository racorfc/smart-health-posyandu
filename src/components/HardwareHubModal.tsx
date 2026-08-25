import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Cpu, 
  Wifi, 
  SlidersHorizontal, 
  Terminal, 
  BookOpen, 
  ExternalLink,
  Zap,
  Layers
} from 'lucide-react';
import { generateESP32C3Code } from '../utils/firmwareGenerator';

interface HardwareHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareHubModal: React.FC<HardwareHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'wiring' | 'api'>('code');
  const [wifiSsid, setWifiSsid] = useState('MyHomeWiFi');
  const [wifiPass, setWifiPass] = useState('Secret1234');
  const [deviceId, setDeviceId] = useState('ESP32C3-HEALTH-01');
  const [intervalMs, setIntervalMs] = useState(2000);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.run.app';
  const espCode = generateESP32C3Code({
    ssid: wifiSsid,
    pass: wifiPass,
    serverUrl: currentHost,
    deviceId,
    intervalMs,
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(espCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleCurl = `curl -X POST "${currentHost}/api/telemetry" \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": "${deviceId}",
    "temperature": 36.8,
    "spo2": 98,
    "heartRate": 74,
    "distance": 172.5,
    "weight": 68.2,
    "battery": 95,
    "rssi": -55
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="hardware-hub-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pusat Integrasi Hardware ESP32-C3
              </h2>
              <p className="text-xs text-slate-400">
                Hubungkan sensor Suhu, Oximeter (SpO2/BPM), Jarak & Berat ke Cloud Internet Gratis
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 pt-2 gap-2">
          <button
            id="tab-btn-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'code'
                ? 'bg-slate-900 text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kode Arduino ESP32-C3</span>
          </button>

          <button
            id="tab-btn-wiring"
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'wiring'
                ? 'bg-slate-900 text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Skema Pinout & Rangkaian</span>
          </button>

          <button
            id="tab-btn-api"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'api'
                ? 'bg-slate-900 text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>REST API Endpoint & cURL</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: CODE GENERATOR */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              {/* Parameter Inputs */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-cyan-400" /> SSID Wi-Fi:
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Password Wi-Fi:
                  </label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    ID Perangkat:
                  </label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Interval Kirim (ms):
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    value={intervalMs}
                    onChange={(e) => setIntervalMs(parseInt(e.target.value) || 2000)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
                  <span className="font-mono text-cyan-400">esp32c3_telemetry_firmware.ino</span>
                  <button
                    id="btn-copy-arduino-code"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode C++'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
                  {espCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: WIRING PINOUT */}
          {activeTab === 'wiring' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Tabel Koneksi Pin ESP32-C3 Super Mini / DevKit
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  ESP32-C3 memiliki pin I2C default pada GPIO 8 (SDA) dan GPIO 9 (SCL). Gunakan level tegangan 3.3V untuk keamanan sensor.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                        <th className="py-2.5 px-3">Modul Sensor</th>
                        <th className="py-2.5 px-3">Pin Sensor</th>
                        <th className="py-2.5 px-3">Pin ESP32-C3</th>
                        <th className="py-2.5 px-3">Tegangan (VCC)</th>
                        <th className="py-2.5 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-rose-300">MAX30102 / MAX30100 (Oximeter)</td>
                        <td className="py-2 px-3 font-mono">SDA, SCL, GND, VIN</td>
                        <td className="py-2 px-3 font-mono text-cyan-400">GPIO 8 (SDA), GPIO 9 (SCL)</td>
                        <td className="py-2 px-3">3.3V</td>
                        <td className="py-2 px-3 text-slate-400">Jalur I2C berkecepatan tinggi</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-amber-300">DS18B20 (Sensor Suhu)</td>
                        <td className="py-2 px-3 font-mono">DATA, GND, VCC</td>
                        <td className="py-2 px-3 font-mono text-cyan-400">GPIO 4</td>
                        <td className="py-2 px-3">3.3V / 5V</td>
                        <td className="py-2 px-3 text-slate-400">Pasang resistor pull-up 4.7kΩ antara VCC & DATA</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-indigo-300">HC-SR04 (Sensor Jarak / Tinggi)</td>
                        <td className="py-2 px-3 font-mono">TRIG, ECHO, GND, VCC</td>
                        <td className="py-2 px-3 font-mono text-cyan-400">TRIG: GPIO 2, ECHO: GPIO 3</td>
                        <td className="py-2 px-3">5V</td>
                        <td className="py-2 px-3 text-slate-400">Gunakan voltage divider 1k/2k pada pin ECHO untuk 3.3V safe</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-emerald-300">HX711 (Modul Load Cell Berat)</td>
                        <td className="py-2 px-3 font-mono">DOUT, SCK, GND, VCC</td>
                        <td className="py-2 px-3 font-mono text-cyan-400">DOUT: GPIO 5, SCK: GPIO 6</td>
                        <td className="py-2 px-3">3.3V / 5V</td>
                        <td className="py-2 px-3 text-slate-400">Load cell 4 kabel (Merah, Hitam, Putih, Hijau)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hardware Tips */}
              <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-2xl p-4 text-xs text-cyan-200 space-y-2">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Tips Koneksi Internet Tanpa Batas:
                </div>
                <p>
                  1. Dashboard ini berjalan di cloud internet. ESP32-C3 Anda dapat terhubung melalui Wi-Fi rumah, hotspot HP seluler, atau jaringan kantor mana saja tanpa perlu setting IP statis atau Port Forwarding!
                </p>
                <p>
                  2. Jika menggunakan sensor MLX90614 (Suhu Non-Contact IR), Anda dapat menghubungkannya paralel ke jalur I2C yang sama (SDA GPIO 8, SCL GPIO 9).
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REST API */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs space-y-3">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Spesifikasi HTTP REST API Endpoint
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/70 font-mono text-cyan-300">
                  POST {currentHost}/api/telemetry
                </div>
                <p className="text-slate-300">
                  Format Header: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">Content-Type: application/json</code>
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-2 font-mono">Uji Cepat via Terminal (cURL):</div>
                <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed bg-slate-900/90 p-3 rounded-xl">
                  {sampleCurl}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>ESP32-C3 IoT Telemetri Cloud • Akses Gratis 24/7</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
