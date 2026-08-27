import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

interface SensorReading {
  id: string;
  timestamp: string;
  deviceId: string;
  temperature: number; // °C
  spo2: number; // %
  heartRate: number; // BPM
  distance: number; // cm
  weight: number; // kg
  battery?: number; // %
  rssi?: number; // dBm
}

// In-memory data store with last 200 readings
const sensorHistory: SensorReading[] = [];
let lastSeenTimestamp: number = Date.now();
const sseClients: express.Response[] = [];

// Initialize with seed readings
function seedInitialData() {
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    const time = new Date(now - i * 3000).toISOString();
    sensorHistory.push({
      id: `seed-${i}-${now - i * 3000}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: time,
      deviceId: 'ESP32C3-HEALTH-01',
      temperature: +(36.4 + Math.sin(i * 0.3) * 0.4).toFixed(1),
      spo2: +(97 + Math.floor(Math.sin(i * 0.5) * 2)),
      heartRate: +(74 + Math.floor(Math.sin(i * 0.4) * 6)),
      distance: +(172 - Math.floor(Math.random() * 2)),
      weight: +(68.2 + Math.sin(i * 0.1) * 0.3).toFixed(1),
      battery: 92,
      rssi: -58,
    });
  }
}
seedInitialData();

function broadcastSSE(reading: SensorReading) {
  const data = JSON.stringify(reading);
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// AI Client Lazy Initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-device-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ESP32-C3 Health Telemetry Gateway',
    totalRecords: sensorHistory.length,
    lastSeen: new Date(lastSeenTimestamp).toISOString(),
    activeSSEConnections: sseClients.length,
  });
});

// GET latest telemetry
app.get('/api/telemetry/latest', (req, res) => {
  const latest = sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1] : null;
  const isOnline = Date.now() - lastSeenTimestamp < 15000;
  res.json({
    latest,
    isOnline,
    lastSeen: new Date(lastSeenTimestamp).toISOString(),
    totalRecords: sensorHistory.length,
  });
});

// GET telemetry history
app.get('/api/telemetry/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const records = sensorHistory.slice(-limit);
  res.json({
    records,
    count: records.length,
  });
});

// SSE Stream
app.get('/api/telemetry/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write('retry: 3000\n\n');
  sseClients.push(res);

  if (sensorHistory.length > 0) {
    const latest = sensorHistory[sensorHistory.length - 1];
    res.write(`data: ${JSON.stringify(latest)}\n\n`);
  }

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// POST endpoint for ESP32 / curl
app.post('/api/telemetry', (req, res) => {
  const body = req.body || {};
  
  const temperature = typeof body.temperature === 'number' ? body.temperature : parseFloat(body.temperature || body.temp || body.suhu) || 36.5;
  const spo2 = typeof body.spo2 === 'number' ? body.spo2 : parseFloat(body.spo2 || body.oxygen) || 98;
  const heartRate = typeof body.heartRate === 'number' ? body.heartRate : parseFloat(body.heartRate || body.bpm || body.nadi) || 75;
  const distance = typeof body.distance === 'number' ? body.distance : parseFloat(body.distance || body.dist || body.jarak || body.tinggi) || 170;
  const weight = typeof body.weight === 'number' ? body.weight : parseFloat(body.weight || body.berat) || 65;
  const deviceId = body.deviceId || body.device || 'ESP32C3-NODE';
  const battery = typeof body.battery === 'number' ? body.battery : parseFloat(body.battery) || 100;
  const rssi = typeof body.rssi === 'number' ? body.rssi : parseFloat(body.rssi) || -60;

  const newReading: SensorReading = {
    id: `esp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    deviceId,
    temperature: +temperature.toFixed(2),
    spo2: +spo2.toFixed(1),
    heartRate: Math.round(heartRate),
    distance: +distance.toFixed(1),
    weight: +weight.toFixed(2),
    battery: Math.round(battery),
    rssi: Math.round(rssi),
  };

  sensorHistory.push(newReading);
  if (sensorHistory.length > 300) {
    sensorHistory.shift();
  }
  lastSeenTimestamp = Date.now();

  broadcastSSE(newReading);

  res.status(201).json({
    success: true,
    message: 'Telemetry received successfully',
    reading: newReading,
    receivedAt: newReading.timestamp,
  });
});

// Simulator route
app.post('/api/telemetry/simulate', (req, res) => {
  const { mode, temperature, spo2, heartRate, distance, weight } = req.body || {};
  
  let baseTemp = 36.6;
  let baseSpo2 = 98;
  let baseHr = 72;
  let baseDist = 172.5;
  let baseWeight = 68.4;

  if (mode === 'fever') {
    baseTemp = 38.8;
    baseSpo2 = 96;
    baseHr = 105;
    baseDist = 172.0;
    baseWeight = 68.0;
  } else if (mode === 'hypoxia') {
    baseTemp = 36.2;
    baseSpo2 = 91;
    baseHr = 112;
    baseDist = 172.0;
    baseWeight = 68.0;
  } else if (mode === 'athlete') {
    baseTemp = 37.1;
    baseSpo2 = 99;
    baseHr = 56;
    baseDist = 178.0;
    baseWeight = 74.5;
  }

  const simReading: SensorReading = {
    id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    deviceId: 'ESP32C3-SIMULATOR',
    temperature: +(temperature !== undefined ? temperature : (baseTemp + (Math.random() * 0.4 - 0.2))).toFixed(1),
    spo2: +(spo2 !== undefined ? spo2 : Math.min(100, Math.max(85, baseSpo2 + Math.floor(Math.random() * 3 - 1)))),
    heartRate: +(heartRate !== undefined ? heartRate : (baseHr + Math.floor(Math.random() * 6 - 3))),
    distance: +(distance !== undefined ? distance : +(baseDist + (Math.random() * 0.6 - 0.3)).toFixed(1)),
    weight: +(weight !== undefined ? weight : +(baseWeight + (Math.random() * 0.2 - 0.1)).toFixed(1)),
    battery: 95,
    rssi: -52,
  };

  sensorHistory.push(simReading);
  if (sensorHistory.length > 300) {
    sensorHistory.shift();
  }
  lastSeenTimestamp = Date.now();
  broadcastSSE(simReading);

  res.json({
    success: true,
    reading: simReading,
  });
});

// Clear telemetry history
app.delete('/api/telemetry/history', (req, res) => {
  sensorHistory.length = 0;
  seedInitialData();
  res.json({ success: true, message: 'Sensor history refreshed' });
});

// AI Health Assessment Endpoint using Gemini
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { temperature, spo2, heartRate, distance, weight, language = 'id' } = req.body;
    const ai = getGenAI();

    if (!ai) {
      const heightM = (distance || 170) / 100;
      const bmi = +( (weight || 65) / (heightM * heightM) ).toFixed(1);
      let bmiCategory = 'Normal';
      if (bmi < 18.5) bmiCategory = 'Kurus / Underweight';
      else if (bmi >= 25 && bmi < 30) bmiCategory = 'Kelebihan Berat / Overweight';
      else if (bmi >= 30) bmiCategory = 'Obesitas / Obesity';

      let riskLevel = 'LOW';
      let alertMsg = 'Parameter tanda vital Anda dalam rentang batas aman.';
      if (temperature > 37.8 || spo2 < 95 || heartRate > 100) {
        riskLevel = 'MODERATE';
        alertMsg = 'Terdeteksi indikasi anomali pada salah satu sensor vital (suhu/SpO2/nadi). Perhatikan hidrasi dan istirahat.';
      }
      if (spo2 < 92 || temperature > 39.0) {
        riskLevel = 'HIGH';
        alertMsg = 'Perhatian! Kadar oksigen (SpO2) atau suhu memerlukan evaluasi medis segera.';
      }

      return res.json({
        summary: `Analisis parameter sensor ESP32-C3: Suhu ${temperature}°C, SpO2 ${spo2}%, Nadi ${heartRate} BPM, Tinggi/Jarak ${distance} cm, Berat ${weight} kg (BMI: ${bmi}).`,
        vitalStatus: {
          temperature: temperature >= 36.1 && temperature <= 37.2 ? 'Normal (Afebris)' : (temperature > 37.5 ? 'Demam (Febris)' : 'Subnormal/Hipotermia Ringan'),
          oxygenation: spo2 >= 95 ? 'Optimal (Normoksia)' : (spo2 >= 90 ? 'Waspada (Hipoksia Ringan)' : 'Kritis (Hipoksia Sedang/Berat)'),
          cardiovascular: heartRate >= 60 && heartRate <= 100 ? 'Normal Sinus Rhythm' : (heartRate > 100 ? 'Takikardia (Denyut Cepat)' : 'Bradikardia (Denyut Lambat)'),
          bodyComposition: `BMI ${bmi} (${bmiCategory})`,
        },
        clinicalInterpretation: alertMsg,
        recommendations: [
          'Pastikan probe sensor oximeter MAX30100/MAX30102 menempel rapat di ujung jari tanpa tertekan berlebihan.',
          'Lakukan pengukuran suhu ulang setelah 5 menit beristirahat dalam suhu ruangan sejuk.',
          'Cukupi kebutuhan air minum harian (minimal 2 liter/hari) dan istirahat teratur.',
          'Jika keluhan berlanjut atau saturasi oksigen <95% menetap, konsultasikan dengan dokter.'
        ],
        riskLevel,
        analyzedAt: new Date().toISOString(),
      });
    }

    const prompt = `Anda adalah asisten medis IoT & Telemetri Kesehatan. Analisis data pembacaan sensor vital real-time dari mikrokontroler ESP32-C3 berikut:
- Suhu Tubuh: ${temperature}°C
- Saturasi Oksigen (SpO2): ${spo2}%
- Denyut Jantung (Heart Rate / Nadi): ${heartRate} BPM
- Jarak / Tinggi Badan: ${distance} cm
- Berat Badan: ${weight} kg

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
    res.json({
      ...parsed,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI health analysis:', error);
    res.status(500).json({
      error: 'Failed to generate AI analysis',
      message: error.message,
    });
  }
});

export default app;
