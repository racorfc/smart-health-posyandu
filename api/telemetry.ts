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
    const last = sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1] : {
      temperature: 36.5,
      spo2: 98,
      heartRate: 75,
      distance: 170.0,
      weight: 65.0,
      battery: 100,
      rssi: -60,
      deviceId: 'ESP32C3-NODE'
    };

    const hasTemp = body.temperature !== undefined || body.temp !== undefined || body.suhu !== undefined;
    const hasSpo2 = body.spo2 !== undefined || body.oxygen !== undefined;
    const hasHeartRate = body.heartRate !== undefined || body.bpm !== undefined || body.nadi !== undefined;
    const hasDistance = body.distance !== undefined || body.dist !== undefined || body.jarak !== undefined || body.tinggi !== undefined;
    const hasWeight = body.weight !== undefined || body.berat !== undefined;
    const hasBattery = body.battery !== undefined;
    const hasRssi = body.rssi !== undefined;

    const temperature = hasTemp ? (typeof body.temperature === 'number' ? body.temperature : parseFloat(body.temperature || body.temp || body.suhu) || last.temperature) : last.temperature;
    const spo2 = hasSpo2 ? (typeof body.spo2 === 'number' ? body.spo2 : parseFloat(body.spo2 || body.oxygen) || last.spo2) : last.spo2;
    const heartRate = hasHeartRate ? (typeof body.heartRate === 'number' ? body.heartRate : parseFloat(body.heartRate || body.bpm || body.nadi) || last.heartRate) : last.heartRate;
    const distance = hasDistance ? (typeof body.distance === 'number' ? body.distance : parseFloat(body.distance || body.dist || body.jarak || body.tinggi) || last.distance) : last.distance;
    const weight = hasWeight ? (typeof body.weight === 'number' ? body.weight : parseFloat(body.weight || body.berat) || last.weight) : last.weight;
    const battery = hasBattery ? (typeof body.battery === 'number' ? body.battery : parseFloat(body.battery) || last.battery) : last.battery;
    const rssi = hasRssi ? (typeof body.rssi === 'number' ? body.rssi : parseFloat(body.rssi) || last.rssi) : last.rssi;
    const deviceId = body.deviceId || body.device || last.deviceId;

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

  if (req.method === 'DELETE') {
    sensorHistory.length = 0;
    return res.status(200).json({ success: true, message: 'Sensor history cleared' });
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
