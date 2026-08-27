import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-device-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { temperature = 36.5, spo2 = 98, heartRate = 75, distance = 170, weight = 65, language = 'id' } = req.body || {};

    const tempNum = typeof temperature === 'number' ? temperature : parseFloat(temperature) || 36.5;
    const spo2Num = typeof spo2 === 'number' ? spo2 : parseFloat(spo2) || 98;
    const hrNum = typeof heartRate === 'number' ? heartRate : parseFloat(heartRate) || 75;
    const distNum = typeof distance === 'number' ? distance : parseFloat(distance) || 170;
    const weightNum = typeof weight === 'number' ? weight : parseFloat(weight) || 65;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Anda adalah asisten medis IoT & Telemetri Kesehatan Posyandu. Analisis data pembacaan sensor vital real-time dari mikrokontroler ESP32-C3 berikut:
- Suhu Tubuh: ${tempNum}°C
- Saturasi Oksigen (SpO2): ${spo2Num}%
- Denyut Jantung (Heart Rate / Nadi): ${hrNum} BPM
- Jarak / Tinggi Badan: ${distNum} cm
- Berat Badan: ${weightNum} kg

Bahasa respons: ${language === 'id' ? 'Bahasa Indonesia yang jelas, profesional, dan empatik' : 'English'}.
Berikan analisis medis ringkas yang komprehensif, evaluasi BMI, potensi risiko klinis, dan rekomendasi praktis.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: 'Ringkasan singkat status kesehatan keseluruhan' },
                vitalStatus: {
                  type: Type.OBJECT,
                  properties: {
                    temperature: { type: Type.STRING, description: 'Evaluasi suhu tubuh' },
                    oxygenation: { type: Type.STRING, description: 'Evaluasi saturasi SpO2' },
                    cardiovascular: { type: Type.STRING, description: 'Evaluasi denyut nadi/jantung' },
                    bodyComposition: { type: Type.STRING, description: 'Evaluasi BMI dan berat/tinggi badan' },
                  },
                  required: ['temperature', 'oxygenation', 'cardiovascular', 'bodyComposition'],
                },
                clinicalInterpretation: { type: Type.STRING, description: 'Interpretasi klinis gabungan dari seluruh indikator vital' },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Daftar rekomendasi gaya hidup atau tindakan medis praktis',
                },
                riskLevel: {
                  type: Type.STRING,
                  description: 'Tingkat risiko: LOW, MODERATE, HIGH, atau CRITICAL',
                },
              },
              required: ['summary', 'vitalStatus', 'clinicalInterpretation', 'recommendations', 'riskLevel'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.status(200).json({
          ...parsed,
          analyzedAt: new Date().toISOString(),
        });
      } catch (aiErr) {
        console.warn('Gemini API call failed, falling back to clinical rules engine:', aiErr);
      }
    }

    // Smart Rule-based Clinical Engine (Zero-Failure Fallback)
    const heightM = distNum / 100;
    const bmi = +(weightNum / (heightM * heightM)).toFixed(1);
    let bmiCategory = 'Normal';
    if (bmi < 18.5) bmiCategory = 'Kurus / Underweight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'Kelebihan Berat / Overweight';
    else if (bmi >= 30) bmiCategory = 'Obesitas / Obesity';

    let riskLevel = 'LOW';
    let alertMsg = 'Semua parameter tanda vital dalam batas aman dan stabil.';
    
    if (tempNum > 37.8 || spo2Num < 95 || hrNum > 100 || hrNum < 55) {
      riskLevel = 'MODERATE';
      alertMsg = 'Terdeteksi indikasi anomali pada salah satu sensor vital (suhu/SpO2/nadi). Perhatikan hidrasi dan istirahat.';
    }
    if (spo2Num < 92 || tempNum >= 39.0 || hrNum > 130) {
      riskLevel = 'HIGH';
      alertMsg = 'Perhatian! Kadar oksigen (SpO2), suhu tubuh, atau nadi memerlukan evaluasi medis segera.';
    }

    return res.status(200).json({
      summary: `Analisis parameter sensor ESP32-C3: Suhu ${tempNum}°C, SpO2 ${spo2Num}%, Nadi ${hrNum} BPM, Tinggi/Jarak ${distNum} cm, Berat ${weightNum} kg (BMI: ${bmi}).`,
      vitalStatus: {
        temperature: tempNum >= 36.1 && tempNum <= 37.2 ? 'Normal (Afebris)' : (tempNum > 37.5 ? `Demam / Febris (${tempNum}°C)` : `Hipotermia / Suhu Rendah (${tempNum}°C)`),
        oxygenation: spo2Num >= 95 ? `Optimal / Normoksia (${spo2Num}%)` : (spo2Num >= 90 ? `Waspada / Hipoksia Ringan (${spo2Num}%)` : `Kritis / Hipoksia (${spo2Num}%)`),
        cardiovascular: hrNum >= 60 && hrNum <= 100 ? `Normal Sinus Rhythm (${hrNum} BPM)` : (hrNum > 100 ? `Takikardia / Cepat (${hrNum} BPM)` : `Bradikardia / Lambat (${hrNum} BPM)`),
        bodyComposition: `BMI ${bmi} (${bmiCategory})`,
      },
      clinicalInterpretation: alertMsg,
      recommendations: [
        'Pastikan posisi sensor kontak rapat dan bersih saat pengukuran.',
        'Lakukan pengukuran suhu ulang setelah 5 menit beristirahat dalam ruangan sejuk.',
        'Cukupi asupan cairan harian (minimal 2 liter air/hari) dan istirahat yang cukup.',
        'Jika kadar SpO2 < 95% atau demam berlanjut, konsultasikan dengan tenaga kesehatan Posyandu/Puskesmas.'
      ],
      riskLevel,
      analyzedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in ai-analysis handler:', error);
    return res.status(500).json({
      error: 'Failed to process AI analysis',
      message: error.message
    });
  }
}
