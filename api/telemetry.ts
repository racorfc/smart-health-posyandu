import type { VercelRequest, VercelResponse } from '@vercel/node';

// Shared state within lambda lifecycle
let sensorHistory: any[] = [
  {
    id: "init-01",
    timestamp: new Date().toISOString(),
    deviceId: "ESP32C3-HEALTH-01",
    temperature: 36.5,
    spo2: 98,
    heartRate: 75,
    distance: 170.0,
    weight: 65.0,
    battery: 100,
    rssi: -60
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-device-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const temperature = typeof body.temperature === 'number' ? body.temperature : parseFloat(body.temperature || body.temp || body.suhu) || 36.5;
    const spo2 = typeof body.spo2 === 'number' ? body.spo2 : parseFloat(body.spo2 || body.oxygen) || 98;
    const heartRate = typeof body.heartRate === 'number' ? body.heartRate : parseFloat(body.heartRate || body.bpm || body.nadi) || 75;
    const distance = typeof body.distance === 'number' ? body.distance : parseFloat(body.distance || body.dist || body.jarak || body.tinggi) || 170;
    const weight = typeof body.weight === 'number' ? body.weight : parseFloat(body.weight || body.berat) || 65;
    const deviceId = body.deviceId || body.device || 'ESP32C3-NODE';
    const battery = typeof body.battery === 'number' ? body.battery : parseFloat(body.battery) || 100;
    const rssi = typeof body.rssi === 'number' ? body.rssi : parseFloat(body.rssi) || -60;

    const newReading = {
      id: `esp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      deviceId,
      temperature: +temperature.toFixed(2),
      spo2: +spo2.toFixed(1),
      heartRate: Math.round(heartRate),
      distance: +distance.toFixed(1),
      weight: +weight.toFixed(2),
      battery: Math.round(battery),
      rssi: Math.round(rssi)
    };

    sensorHistory.push(newReading);
    if (sensorHistory.length > 200) {
      sensorHistory.shift();
    }

    return res.status(200).json({
      success: true,
      message: 'Telemetry received successfully',
      reading: newReading
    });
  }

  // GET Request (telemetry, history, latest)
  const latest = sensorHistory[sensorHistory.length - 1];
  return res.status(200).json({
    latest,
    records: sensorHistory,
    isOnline: true,
    count: sensorHistory.length
  });
}
