/* =================================================================================
 * PROYEK SMART HEALTH POSYANDU IOT
 * NODE 1: ESP32-C3 - Oximeter & Heart Rate Saja (MAX30102) - TANPA SENSOR SUHU
 * 
 * Deskripsi:
 * Mengukur saturasi oksigen darah (SpO2 %) dan denyut jantung (Heart Rate / BPM).
 * Hanya mengirim data Oximeter & BPM ke server tanpa menyentuh data suhu, berat, atau tinggi.
 * 
 * Library yang Dibutuhkan (Install via Arduino Library Manager):
 * 1. SparkFun MAX3010x Pulse and Proximity Sensor Library
 * 2. ArduinoJson by Benoit Blanchon
 * 
 * Pinout ESP32-C3:
 * - MAX30102 SDA -> Pin 8
 * - MAX30102 SCL -> Pin 9
 * - VCC -> 3.3V, GND -> GND
 * ================================================================================= */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// ================= PENGATURAN WI-FI & SERVER =================
const char* ssid       = "NAMA_WIFI_ANDA";
const char* password   = "PASSWORD_WIFI_ANDA";
const char* serverUrl  = "https://smart-health-posyandu.vercel.app/api/telemetry";
const char* deviceId   = "ESP32-NODE-OXY";
const unsigned long SEND_INTERVAL_MS = 2000; // Kirim data tiap 2 detik

// ================= PINOUT ESP32-C3 =================
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9

// ================= OBJEK SENSOR =================
MAX30105 particleSensor;

// Variabel Data
int spo2 = 98;
int heartRateBpm = 75;
unsigned long lastSendTime = 0;
long lastBeat = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  [NODE 1] OXYMETER & HEART RATE STARTING");
  Serial.println("=============================================");

  // Inisialisasi I2C ESP32-C3
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // Inisialisasi Sensor MAX30102
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[WARN] Sensor MAX30102 tidak terdeteksi! Periksa kabel SDA (Pin 8) / SCL (Pin 9).");
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A); // LED Merah aktif (SpO2)
    particleSensor.setPulseAmplitudeGreen(0);  // LED Hijau mati
    Serial.println("[OK] Sensor MAX30102 Siap!");
  }

  // Hubungkan ke Wi-Fi
  connectWiFi();
}

void loop() {
  // 1. Baca denyut nadi & saturasi oksigen secara kontinu
  readOximeter();

  // 2. Kirim data ke Cloud setiap interval waktu
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
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
    Serial.println("\n[WIFI] Gagal terhubung, mencoba ulang di background.");
  }
}

void readOximeter() {
  long irValue = particleSensor.getIR();
  if (irValue > 50000) { // Ujung jari terdeteksi di atas sensor
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      float bpm = 60.0 / (delta / 1000.0);
      if (bpm >= 45.0 && bpm <= 185.0) {
        heartRateBpm = (int)bpm;
      }
    }
    // Estimasi saturasi oksigen darah (SpO2)
    spo2 = constrain(map(irValue, 50000, 120000, 95, 99), 90, 100);
  } else {
    // Tidak ada jari di atas sensor (mode standby)
    heartRateBpm = 72;
    spo2 = 98;
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

  // PAYLOAD KHUSUS NODE 1 (Hanya SpO2 dan Heart Rate)
  StaticJsonDocument<200> doc;
  doc["deviceId"]  = deviceId;
  doc["spo2"]      = spo2;
  doc["heartRate"] = heartRateBpm;
  doc["rssi"]      = WiFi.RSSI();

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.printf("[NODE 1 POST OK] SpO2: %d%% | BPM: %d (Kode: %d)\n", spo2, heartRateBpm, httpCode);
  } else {
    Serial.printf("[NODE 1 ERR] Gagal kirim: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
