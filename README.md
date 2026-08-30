# 🏥 Smart Health Posyandu - IoT Realtime Telemetry Dashboard

Platform pemantauan telemetri kesehatan Posyandu multi-sensor *real-time* berbasis **ESP32-C3**, **React**, **TypeScript**, dan **Tailwind CSS**.

---

## 🌟 Fitur Utama
* 📊 **Dashboard Vital Kontinu**: Suhu Tubuh (°C), Oximeter (SpO2 %), Detak Jantung (BPM), Tinggi Badan (cm), dan Berat Badan (kg).
* 📡 **Arsitektur Multi-Node Modular**: Mendukung pembagian beban ke 3 Node ESP32 terpisah:
  1. **Node 1**: Oximeter & Suhu Tubuh (MAX30102 + DS18B20)
  2. **Node 2**: Timbangan Digital (HX711 + Load Cell)
  3. **Node 3**: Pengukur Tinggi Badan (HC-SR04 Ultrasonic)
* 🧠 **AI Health Assistant (Gemini)**: Analisis klinis otomatis tanda vital dan evaluasi BMI.
* 💾 **Anti-Reset Persistent Storage**: Data sensor terkini tersimpan permanen di browser *LocalStorage*.
* 📈 **Grafik Real-time & Riwayat Data**: Visualisasi multi-channel dan pencatatan riwayat pasien.

---

## 📂 Firmware Arduino untuk ESP32

Kodingan Arduino untuk masing-masing Node tersedia di folder [`/firmware`](./firmware):
* 🩺 [**Node 1: Oximeter & Suhu (.ino)**](./firmware/Node1_Oxymeter_HeartRate_Suhu/Node1_Oxymeter_HeartRate_Suhu.ino)
* ⚖️ [**Node 2: Timbangan Berat Badan (.ino)**](./firmware/Node2_Timbangan_Berat/Node2_Timbangan_Berat.ino)
* 📏 [**Node 3: Pengukur Tinggi Badan (.ino)**](./firmware/Node3_Pengukur_Tinggi/Node3_Pengukur_Tinggi.ino)

📖 **Panduan lengkap perkabelan dan library**: Lihat [Panduan Firmware](./firmware/README.md).

---

## 🚀 Endpoint API Telemetri (HTTP REST POST)

**URL**: `https://smart-health-posyandu.vercel.app/api/telemetry`  
**Method**: `POST`  
**Content-Type**: `application/json`

### Contoh Payload Parsial (Multi-Node):
```json
// Contoh Payload Node 1 (Oximeter & Suhu)
{
  "deviceId": "ESP32-NODE-OXY",
  "temperature": 36.6,
  "spo2": 98,
  "heartRate": 76
}

// Contoh Payload Node 2 (Timbangan)
{
  "deviceId": "ESP32-NODE-WEIGHT",
  "weight": 54.2
}

// Contoh Payload Node 3 (Tinggi Badan)
{
  "deviceId": "ESP32-NODE-HEIGHT",
  "distance": 162.0
}
```
*Backend otomatis menggabungkan (merge) data sensor baru tanpa menimpa sensor lain yang belum diupdate.*

---

## 🛠️ Pengembangan Lokal

```bash
# Clone repository
git clone https://github.com/racorfc/smart-health-posyandu.git
cd smart-health-posyandu

# Install dependensi
npm install

# Jalankan server lokal (Express + Vite)
npm run dev
```
Buka browser di: `http://localhost:3000`
