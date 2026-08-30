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
  │ Oximeter & Suhu│  │ Timbangan Berat│  │ Pengukur Tinggi│
  │   (MAX30102 +  │  │  (HX711 Load   │  │ (Ultrasonic    │
  │    DS18B20)    │  │     Cell)      │  │    HC-SR04)    │
  └────────────────┘  └────────────────┘  └────────────────┘
```

---

## 📁 Daftar Program Node:

### 1. [Node 1: Oximeter & Suhu Tubuh](./Node1_Oxymeter_HeartRate_Suhu/Node1_Oxymeter_HeartRate_Suhu.ino)
* **Sensor**: MAX30102 (Saturasi Oksigen & Detak Jantung) + DS18B20 (Suhu Tubuh).
* **Pinout ESP32-C3**:
  * MAX30102: `SDA -> Pin 8`, `SCL -> Pin 9`, `VCC -> 3.3V`, `GND -> GND`
  * DS18B20: `Data -> Pin 4` (Pull-up resistor 4.7kΩ ke 3.3V)
* **Payload JSON yang dikirim**:
  ```json
  {
    "deviceId": "ESP32-NODE-OXY",
    "temperature": 36.6,
    "spo2": 98,
    "heartRate": 76,
    "rssi": -55
  }
  ```

---

### 2. [Node 2: Timbangan Berat Badan Digital](./Node2_Timbangan_Berat/Node2_Timbangan_Berat.ino)
* **Sensor**: Modul ADC HX711 + Load Cell (Timbangan Berat).
* **Pinout ESP32-C3**:
  * HX711: `DOUT -> Pin 5`, `SCK -> Pin 6`, `VCC -> 5V / 3.3V`, `GND -> GND`
* **Payload JSON yang dikirim**:
  ```json
  {
    "deviceId": "ESP32-NODE-WEIGHT",
    "weight": 52.4,
    "rssi": -60
  }
  ```

---

### 3. [Node 3: Pengukur Tinggi Badan Digital](./Node3_Pengukur_Tinggi/Node3_Pengukur_Tinggi.ino)
* **Sensor**: Ultrasonik HC-SR04.
* **Pinout ESP32-C3**:
  * HC-SR04: `TRIG -> Pin 2`, `ECHO -> Pin 3`, `VCC -> 5V`, `GND -> GND`
* **Rumus**: $\text{Tinggi Badan} = \text{Tinggi Tiang Plafon (200 cm)} - \text{Jarak ke Kepala}$
* **Payload JSON yang dikirim**:
  ```json
  {
    "deviceId": "ESP32-NODE-HEIGHT",
    "distance": 158.5,
    "rssi": -58
  }
  ```

---

## 🛠️ Persiapan Arduino IDE:
1. Pasang Board ESP32 di Arduino IDE: `esp32 by Espressif Systems`
2. Buka **Tools -> Board -> ESP32-C3 Dev Module** (atau sesuai board ESP32 Anda).
3. Install Library via **Tools -> Manage Libraries**:
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
   - `OneWire`
   - `DallasTemperature`
   - `HX711 Arduino Library by Bogdan Necula`
   - `ArduinoJson by Benoit Blanchon`
4. Masukkan nama Wi-Fi (`ssid`) dan kata sandi (`password`) Anda di masing-masing file `.ino`.
5. Upload program ke board ESP32 masing-masing.
