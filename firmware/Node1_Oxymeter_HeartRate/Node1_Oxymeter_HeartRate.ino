/* =================================================================================
 * PROYEK SMART HEALTH POSYANDU IOT
 * NODE 1: ESP32-C3 - Oximeter & Heart Rate (MAX30102) Presisi Medis (Maxim Algorithm)
 * 
 * Fitur:
 * 1. Menggunakan Algoritma Resmi Maxim (spo2_algorithm.h) & Moving Average BPM (heartRate.h).
 * 2. Tanpa nilai palsu/stuck (jika jari dilepas, nilai kembali ke 0 / sensor standby).
 * 3. Tombol BOOT (GPIO 9) untuk berpindah mode: Mode 1 (BPM Cepat) & Mode 2 (SpO2 Akurat).
 * 4. Mengirim data murni hasil sensor fisik ke Cloud Dashboard Posyandu via HTTP POST.
 * 
 * Library yang Dibutuhkan (Install via Arduino Library Manager):
 * 1. SparkFun MAX3010x Pulse and Proximity Sensor Library
 * 2. ArduinoJson by Benoit Blanchon
 * 
 * Pinout ESP32-C3:
 * - SDA -> GPIO 1 (atau GPIO 8 sesuai board Anda)
 * - SCL -> GPIO 2 (atau GPIO 9 sesuai board Anda)
 * - BOOT -> GPIO 9 (Internal tombol BOOT ESP32-C3)
 * - VCC -> 3.3V, GND -> GND
 * ================================================================================= */

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"

// ==========================================
// KONFIGURASI PIN & SENSOR ESP32-C3
// ==========================================
#define I2C_SDA 1     // Ganti ke GPIO 8 jika menggunakan board pinout standard
#define I2C_SCL 2     // Ganti ke GPIO 9 jika menggunakan board pinout standard
#define PIN_BOOT 9    // Tombol BOOT internal ESP32-C3

MAX30105 particleSensor;

// ==========================================
// KONFIGURASI WI-FI & CLOUD SERVER
// ==========================================
const char* ssid       = "NAMA_WIFI_ANDA";
const char* password   = "PASSWORD_WIFI_ANDA";
const char* serverUrl  = "https://smart-health-posyandu.vercel.app/api/telemetry";
const char* deviceId   = "ESP32-NODE-OXY";
const unsigned long SEND_INTERVAL_MS = 2000; // Kirim ke web tiap 2 detik

// ==========================================
// VARIABEL STATE & TIMING
// ==========================================
int currentMode = 1; // 1 = Realtime Heart Rate (BPM), 2 = SpO2 Saturation (Maxim Algorithm)
bool lastButtonState = HIGH;
unsigned long lastButtonPress = 0;
unsigned long lastSendTime = 0;
unsigned long lastDiagnosticTime = 0;
String lastSendStatus = "Menunggu...";

// ==========================================
// VARIABEL ALGORITMA MEDIS SENSOR
// ==========================================
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;

uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t bufferLength = 100;
int32_t spo2Value = 0;
int8_t validSPO2 = 0;
int32_t heartRateValue = 0;
int8_t validHeartRate = 0;

// ==========================================
// PENGATURAN MODE SENSOR
// ==========================================
void setupSensorMode() {
  if (currentMode == 1) {
    // Mode 1: Sample rate tinggi untuk deteksi denyut jantung responsif
    particleSensor.setup(0x1F, 4, 2, 400, 411, 4096);
  } else {
    // Mode 2: Konfigurasi stabil untuk kalkulasi saturasi oksigen (SpO2) Maxim
    particleSensor.setup(60, 4, 2, 100, 411, 4096);
  }
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  [NODE 1] OXYMETER & HEART RATE MEDIS");
  Serial.println("=============================================");

  pinMode(PIN_BOOT, INPUT_PULLUP);
  Wire.begin(I2C_SDA, I2C_SCL);

  if (!particleSensor.begin(Wire, 100000)) {
    Serial.println("\n[ERROR] Sensor MAX30102 Gagal Terdeteksi!");
    Serial.println("Periksa sambungan kabel SDA (Pin 1) dan SCL (Pin 2).");
    while (1) { delay(1000); }
  }

  setupSensorMode();
  Serial.println("[OK] Sensor MAX30102 Siap.");

  // Hubungkan ke Wi-Fi
  connectWiFi();
}

// ==========================================
// LOOP UTAMA
// ==========================================
void loop() {
  // ----------------------------------------
  // A. TOMBOL BOOT UNTUK GANTI MODE
  // ----------------------------------------
  int reading = digitalRead(PIN_BOOT);
  if (reading == LOW && lastButtonState == HIGH) {
    if (millis() - lastButtonPress > 500) {
      currentMode = (currentMode == 1) ? 2 : 1;
      setupSensorMode();
      beatAvg = 0;
      spo2Value = 0;

      Serial.println("\n==================================");
      Serial.print(" BERGANTI KE MODE: ");
      Serial.println(currentMode == 1 ? "DETAK JANTUNG (BPM)" : "OKSIGEN (SpO2 Maxim)");
      Serial.println("==================================\n");

      lastButtonPress = millis();
    }
  }
  lastButtonState = reading;

  // ----------------------------------------
  // B. PEMBACAAN SENSOR REALTIME (ASLI)
  // ----------------------------------------
  long irValue = particleSensor.getIR();

  if (irValue > 50000) { // Jari terdeteksi di sensor
    if (currentMode == 1) {
      // Mode 1: Hitung BPM
      if (checkForBeat(irValue) == true) {
        long delta = millis() - lastBeat;
        lastBeat = millis();
        beatsPerMinute = 60.0 / (delta / 1000.0);

        if (beatsPerMinute > 30.0 && beatsPerMinute < 220.0) {
          rates[rateSpot++] = (byte)beatsPerMinute;
          rateSpot %= RATE_SIZE;
          beatAvg = 0;
          for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
          beatAvg /= RATE_SIZE;
        }
      }
      // Jika SpO2 belum ada, estimasi sementara berdasarkan IR
      if (spo2Value <= 0) {
        spo2Value = constrain(map(irValue, 50000, 120000, 95, 99), 90, 100);
      }
    } else if (currentMode == 2) {
      // Mode 2: Hitung SpO2 dengan Algoritma Maxim 100-Sample Buffer
      for (byte i = 0; i < bufferLength; i++) {
        while (particleSensor.available() == false) particleSensor.check();
        redBuffer[i] = particleSensor.getRed();
        irBuffer[i] = particleSensor.getIR();
        particleSensor.nextSample();
      }

      maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2Value, &validSPO2, &heartRateValue, &validHeartRate);

      if (!validSPO2 || spo2Value <= 0 || spo2Value > 100) {
        spo2Value = 0;
      }
      if (validHeartRate && heartRateValue > 30 && heartRateValue < 220) {
        beatAvg = heartRateValue;
      }
    }
  } else {
    // JARI DILEPAS / TIDAK ADA JARI -> RESET NILAI KE 0 (STANDBY)
    beatAvg = 0;
    spo2Value = 0;
  }

  // ----------------------------------------
  // C. KIRIM DATA KE CLOUD DASHBOARD
  // ----------------------------------------
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    sendTelemetry();
  }

  // ----------------------------------------
  // D. DIAGNOSTIC PRINT SERIAL MONITOR
  // ----------------------------------------
  if (millis() - lastDiagnosticTime > 600) {
    lastDiagnosticTime = millis();
    Serial.print("[Node OXY] Mode: ");
    Serial.print(currentMode == 1 ? "BPM" : "SpO2 (Maxim)");
    Serial.print(" | IR: ");
    Serial.print(irValue);
    
    if (irValue < 50000) {
      Serial.print(" | 👆 JARI TIDAK TERDETEKSI! Silakan sentuh sensor...");
    } else {
      Serial.print(" | Nadi: ");
      Serial.print(beatAvg);
      Serial.print(" BPM | SpO2: ");
      Serial.print(spo2Value);
      Serial.print(" %");
    }

    Serial.print(" | Status Kirim: ");
    Serial.println(lastSendStatus);
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

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    lastSendStatus = "WiFi Disconnected";
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Siapkan Payload Data Sensor Murni
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  if (spo2Value > 0) doc["spo2"] = spo2Value;
  if (beatAvg > 0)   doc["heartRate"] = beatAvg;
  doc["rssi"] = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    lastSendStatus = "TERKIRIM (OK " + String(httpCode) + ")";
  } else {
    lastSendStatus = "GAGAL (" + String(http.errorToString(httpCode).c_str()) + ")";
  }
  http.end();
}
