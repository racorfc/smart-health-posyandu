import { SensorData, HealthAssessment } from '../types';

export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesity' } {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return { bmi: 0, category: 'Normal' };
  }
  const heightM = heightCm / 100;
  const bmi = +(weightKg / (heightM * heightM)).toFixed(1);

  let category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesity' = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25.0) category = 'Normal';
  else if (bmi < 30.0) category = 'Overweight';
  else category = 'Obesity';

  return { bmi, category };
}

export function evaluateHealthMetrics(data: SensorData): HealthAssessment {
  const { bmi, category: bmiCategory } = calculateBMI(data.weight, data.distance);

  // Temperature
  let temperatureStatus: HealthAssessment['temperatureStatus'] = 'Normal';
  if (data.temperature < 35.0) temperatureStatus = 'Hipotermia';
  else if (data.temperature <= 37.3) temperatureStatus = 'Normal';
  else if (data.temperature <= 38.5) temperatureStatus = 'Demam Rendah';
  else temperatureStatus = 'Demam Tinggi';

  // SpO2
  let spo2Status: HealthAssessment['spo2Status'] = 'Normal';
  if (data.spo2 >= 95) spo2Status = 'Normal';
  else if (data.spo2 >= 90) spo2Status = 'Waspada';
  else spo2Status = 'Kritis (Hipoksia)';

  // Heart Rate
  let heartRateStatus: HealthAssessment['heartRateStatus'] = 'Normal';
  if (data.heartRate < 60) heartRateStatus = 'Bradikardia';
  else if (data.heartRate <= 100) heartRateStatus = 'Normal';
  else heartRateStatus = 'Takikardia';

  // Overall Risk
  let riskScore = 0;
  if (temperatureStatus === 'Demam Tinggi' || temperatureStatus === 'Hipotermia') riskScore += 2;
  else if (temperatureStatus === 'Demam Rendah') riskScore += 1;

  if (spo2Status === 'Kritis (Hipoksia)') riskScore += 3;
  else if (spo2Status === 'Waspada') riskScore += 1;

  if (heartRateStatus !== 'Normal') riskScore += 1;
  if (bmiCategory === 'Obesity') riskScore += 1;

  let overallRisk: HealthAssessment['overallRisk'] = 'Sehat';
  if (riskScore >= 3) overallRisk = 'Bahaya';
  else if (riskScore === 2) overallRisk = 'Waspada';
  else if (riskScore === 1) overallRisk = 'Perhatian';

  return {
    bmi,
    bmiCategory,
    temperatureStatus,
    spo2Status,
    heartRateStatus,
    overallRisk,
  };
}

export function formatTimeAgo(isoString: string): string {
  if (!isoString) return '-';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 2) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} detik lalu`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
  return `${Math.floor(diffSec / 3600)} jam lalu`;
}
