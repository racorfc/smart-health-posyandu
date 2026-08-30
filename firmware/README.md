# 📡 Panduan Firmware IoT Posyandu Multi-Node ESP32-C3

Folder ini berisi kode program Arduino resmi untuk sistem **Smart Health Posyandu** dengan arsitektur **3 Node ESP32 Terpisah (Modular)**.

---

## 🏛️ Arsitektur Multi-Node

Setiap perangkat ESP32 bertindak sebagai node independen yang hanya mengirim data sensor miliknya tanpa menghapus/menimpa data dari node lainnya.

```
                  ┌────────────────────────┐
                  │   DASHBOARD POSYANDU   │
                  │ (Vercel / Cloud Realtime)
                  └───────────▲────────────┘
                              │ HTTP REST POST (JSON)
          ┌───────────────────┼───────────────────┐
          │                   │                   │
  ┌───────┴────────┐  ┌───────┴────────┐  ┌───────┴────────┐
  │     NODE 1     │  │     NODE 2     │  │     NODE 3     │
  │ Oximeter & BPM │  │ Timbangan Berat│  │ Pengukur Tinggi│
  │   (MAX30102)   │  │  (HX711 Load   │  │ (Ultrasonic    │
  │  (Tanpa Suhu)  │  │     Cell)      │  │    HC-SR04)    │
  └────────────────┘  └────────────────┘  └────────────────┘
```

---

## 📁 Daftar Program Node:

### 1. [Node 1: Oximeter & Heart Rate (MAX30102 Saja)](./Node1_Oxymeter_HeartRate/Node1_Oxymeter_HeartRate.ino)
* **Sensor**: MAX30102 (Saturasi Oksigen SpO2 % & Detak Jantung BPM).
* **Pinout ESP32-C3**:
  * `SDA -> Pin 8`
  * `SCL -> Pin 9`
  * `VCC -> 3.3V`
  * `GND -> GND`
* **Payload JSON yang dikirim**:
  ```json
  {
    "deviceId": "ESP32-NODE-OXY",
    "spo2": 98,
    "heartRate": 76
  }
  ```

---

### 2. [Node 2: Timbangan Berat Badan Digital](./Node2_Timbangan_Berat/Node2_Timbangan_Berat.ino)
* **Sensor**: Modul ADC HX711 + Load Cell.
* **Pinout ESP32-C3**:
  * `DOUT -> Pin 5`
  * `SCK -> Pin 6`
  * `VCC -> 5V / 3.3V`
  * `GND -> GND`
* **Payload JSON yang dikirim**:
  ```json
  {
    "deviceId": "ESP32-NODE-WEIGHT",
    "weight": 52.4
  }
  ```

---

### 3. [Node 3: Pengukur Tinggi Badan Digital](./Node3_Pengukur_Tinggi/Node3_Pengukur_Tinggi.ino)
* **Sensor**: Ultrasonik HC-SR04.
* **Pinout ESP32-C3**:
  * `TRIG -> Pin 2`
  * `ECHO -> Pin 3`
  * `VCC -> 5V`
  * `GND -> GND`
* **Rumus**: $\text{Tinggi Badan} = \text{Tinggi Tiang (200 cm)} - \text{Jarak ke Kepala}$
* **Payload JSON yang dikirim**:
  ```json
  {
    "deviceId": "ESP32-NODE-HEIGHT",
    "distance": 158.5
  }
  ```

---

## 🛠️ Persiapan Arduino IDE:
1. Pasang Board ESP32 di Arduino IDE: `esp32 by Espressif Systems`
2. Buka **Tools -> Board -> ESP32-C3 Dev Module** (atau sesuai board ESP32 Anda).
3. Install Library via **Tools -> Manage Libraries**:
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
   - `HX711 Arduino Library by Bogdan Necula`
   - `ArduinoJson by Benoit Blanchon`
4. Masukkan nama Wi-Fi (`ssid`) dan kata sandi (`password`) Anda di masing-masing file `.ino`.
5. Upload program ke board ESP32 masing-masing.
