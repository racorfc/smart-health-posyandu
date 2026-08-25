export interface SensorData {
  id: string;
  timestamp: string; // ISO string
  deviceId: string;
  temperature: number; // in Celsius
  spo2: number; // percentage 0 - 100
  heartRate: number; // bpm
  distance: number; // cm
  weight: number; // kg
  battery?: number; // percentage 0 - 100
  rssi?: number; // dBm e.g. -65
}

export interface TelemetrySummary {
  latest: SensorData | null;
  count: number;
  lastUpdated: string | null;
  deviceStatus: 'online' | 'standby' | 'offline';
  avgTemperature: number;
  avgSpo2: number;
  avgHeartRate: number;
  avgDistance: number;
  avgWeight: number;
}

export interface HealthAssessment {
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obesity';
  temperatureStatus: 'Normal' | 'Demam Rendah' | 'Demam Tinggi' | 'Hipotermia';
  spo2Status: 'Normal' | 'Waspada' | 'Kritis (Hipoksia)';
  heartRateStatus: 'Normal' | 'Bradikardia' | 'Takikardia';
  overallRisk: 'Sehat' | 'Perhatian' | 'Waspada' | 'Bahaya';
}

export interface GeminiAnalysisResult {
  summary: string;
  vitalStatus: {
    temperature: string;
    oxygenation: string;
    cardiovascular: string;
    bodyComposition: string;
  };
  clinicalInterpretation: string;
  recommendations: string[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  analyzedAt: string;
}

export interface DeviceConfig {
  deviceId: string;
  deviceLabel: string;
  targetUrl: string;
  wifiSsid: string;
  wifiPass: string;
  sendIntervalMs: number;
  heightReferenceCm: number; // e.g. 200cm distance to floor for height calculation
}
