import type { VercelRequest, VercelResponse } from '@vercel/node';

let lastData = {
  deviceId: "ESP32C3-HEALTH-01",
  temperature: 36.5,
  spo2: 98,
  heartRate: 75,
  distance: 170.0,
  weight: 65.0,
  battery: 100,
  rssi: -60,
  timestamp: new Date().toISOString()
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-device-key');

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

    lastData = {
      deviceId,
      temperature: +temperature.toFixed(2),
      spo2: +spo2.toFixed(1),
      heartRate: Math.round(heartRate),
      distance: +distance.toFixed(1),
      weight: +weight.toFixed(2),
      battery: Math.round(battery),
      rssi: Math.round(rssi),
      timestamp: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      message: 'Telemetry received successfully',
      reading: lastData
    });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      latest: lastData,
      records: [lastData],
      isOnline: true
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
