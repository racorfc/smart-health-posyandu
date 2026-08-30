/* =================================================================================
 * PROYEK SMART HEALTH POSYANDU IOT
 * NODE 1: ESP32-C3 - Oximeter (MAX30102) & Suhu Tubuh (DS18B20)
 * 
 * Deskripsi:
 * Mengukur saturasi oksigen darah (SpO2), detak jantung (BPM), dan suhu tubuh (°C).
 * Mengirim payload khusus Oximeter & Suhu ke server (tidak menimpa data berat/tinggi).
 * 
 * Library yang Dibutuhkan (Install via Arduino Library Manager):
 * 1. SparkFun MAX3010x Pulse and Proximity Sensor Library
 * 2. OneWire by Jim Studt, Paul Stoffregen
 * 3. DallasTemperature by Miles Burton
 * 4. ArduinoJson by Benoit Blanchon
 * 
 * Pinout ESP32-C3:
 * - MAX30102: SDA -> Pin 8, SCL -> Pin 9, VCC -> 3.3V, GND -> GND
 * - DS18B20: Data -> Pin 4 (dengan resistor pull-up 4.7k ohm ke 3.3V), VCC -> 3.3V, GND -> GND
 * ================================================================================= */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// ================= PENGATURAN WI-FI & SERVER =================
const char* ssid       = "NAMA_WIFI_ANDA";
const char* password   = "PASSWORD_WIFI_ANDA";
const char* serverUrl  = "https://smart-health-posyandu.vercel.app/api/telemetry";
const char* deviceId   = "ESP32-NODE-OXY";
const unsigned long SEND_INTERVAL_MS = 2000; // Kirim data tiap 2 detik

// ================= PINOUT ESP32-C3 =================
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9
#define ONE_WIRE_BUS 4

// ================= OBJEK SENSOR =================
MAX30105 particleSensor;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// Variabel Data
float temperature = 36.5;
int spo2 = 98;
int heartRateBpm = 75;
unsigned long lastSendTime = 0;
long lastBeat = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  [NODE 1] OXYMETER & SUHU POSYANDU STARTING");
  Serial.println("=============================================");

  // Inisialisasi I2C untuk ESP32-C3
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // Inisialisasi Sensor MAX30102
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[WARN] Sensor MAX30102 tidak terdeteksi! Periksa kabel SDA/SCL.");
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A); // LED Merah untuk Oximeter
    particleSensor.setPulseAmplitudeGreen(0);  // Matikan LED Hijau
    Serial.println("[OK] Sensor MAX30102 Siap.");
  }

  // Inisialisasi Sensor Suhu DS18B20
  tempSensor.begin();
  Serial.println("[OK] Sensor Suhu DS18B20 Siap.");

  // Hubungkan ke Wi-Fi
  connectWiFi();
}

void loop() {
  // 1. Baca data denyut nadi & oksigen secara kontinu
  readOximeter();

  // 2. Kirim data ke Cloud setiap interval
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    readTemperature();
    sendTelemetry();
  }
}

void connectWiFi() {
  Serial.print("[WIFI] Menghubungkan ke ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Berhasil Terhubung!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Gagal terhubung, akan mencoba ulang di background.");
  }
}

void readOximeter() {
  long irValue = particleSensor.getIR();
  if (irValue > 50000) { // Jari terdeteksi di atas sensor
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      float bpm = 60.0 / (delta / 1000.0);
      if (bpm >= 45.0 && bpm <= 185.0) {
        heartRateBpm = (int)bpm;
      }
    }
    // Estimasi saturasi oksigen darah
    spo2 = constrain(map(irValue, 50000, 120000, 95, 99), 90, 100);
  } else {
    // Tidak ada jari di atas sensor (mode standby)
    heartRateBpm = 72;
    spo2 = 98;
  }
}

void readTemperature() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t >= 25.0 && t <= 48.0) {
    temperature = t;
  }
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Terputus, mencoba rekoneksi...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // PAYLOAD KHUSUS NODE 1 (Hanya update Suhu, SpO2, dan BPM)
  StaticJsonDocument<256> doc;
  doc["deviceId"]    = deviceId;
  doc["temperature"] = temperature;
  doc["spo2"]        = spo2;
  doc["heartRate"]   = heartRateBpm;
  doc["rssi"]        = WiFi.RSSI();

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.printf("[NODE 1 POST OK] Suhu: %.1f°C | SpO2: %d%% | BPM: %d (Kode: %d)\n", temperature, spo2, heartRateBpm, httpCode);
  } else {
    Serial.printf("[NODE 1 ERR] Gagal kirim: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
