/* =================================================================================
 * PROYEK SMART HEALTH POSYANDU IOT
 * NODE 2: ESP32-C3 - Timbangan Berat Badan Digital (HX711 + Load Cell)
 * 
 * Deskripsi:
 * Mengukur berat badan pasien/balita secara akurat menggunakan Load Cell dan modul ADC HX711.
 * Mengirim payload khusus Berat Badan (weight) ke server (tidak menimpa data suhu/oxymeter/tinggi).
 * 
 * Library yang Dibutuhkan (Install via Arduino Library Manager):
 * 1. HX711 Arduino Library by Bogdan Necula
 * 2. ArduinoJson by Benoit Blanchon
 * 
 * Pinout ESP32-C3:
 * - HX711 DOUT -> Pin 5
 * - HX711 SCK  -> Pin 6
 * - VCC -> 5V (atau 3.3V), GND -> GND
 * ================================================================================= */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "HX711.h"

// ================= PENGATURAN WI-FI & SERVER =================
const char* ssid       = "NAMA_WIFI_ANDA";
const char* password   = "PASSWORD_WIFI_ANDA";
const char* serverUrl  = "https://smart-health-posyandu.vercel.app/api/telemetry";
const char* deviceId   = "ESP32-NODE-WEIGHT";
const unsigned long SEND_INTERVAL_MS = 2000; // Kirim data tiap 2 detik

// ================= PINOUT ESP32-C3 =================
#define HX711_DOUT 5
#define HX711_SCK  6

// ================= OBJEK TIMBANGAN =================
HX711 scale;

// FAKTOR KALIBRASI:
// Sesuaikan nilai ini dengan hasil kalibrasi timbangan load cell Anda (misal: 50kg, 100kg, atau 200kg)
const float CALIBRATION_FACTOR = -7050.0; 

float weightKg = 0.0;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  [NODE 2] TIMBANGAN DIGITAL POSYANDU STARTING");
  Serial.println("=============================================");

  // Inisialisasi Modul HX711
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); // Otomatis set ke 0.00 kg saat pertama kali dinyalakan tanpa beban
  Serial.println("[OK] Modul HX711 Siap & Tare Berhasil.");

  // Hubungkan ke Wi-Fi
  connectWiFi();
}

void loop() {
  // Kirim data berkala
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    readWeight();
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

void readWeight() {
  if (scale.is_ready()) {
    float rawWeight = scale.get_units(5); // Ambil rata-rata 5 pembacaan stabil
    if (rawWeight >= 0.0) {
      weightKg = rawWeight;
    } else {
      weightKg = 0.0;
    }
  } else {
    Serial.println("[WARN] Sensor HX711 belum siap membaca.");
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

  // PAYLOAD KHUSUS NODE 2 (HANYA MENGIRIM BERAT BADAN)
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["weight"]   = weightKg;
  doc["rssi"]     = WiFi.RSSI();

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.printf("[NODE 2 POST OK] Berat Badan: %.2f kg (Kode: %d)\n", weightKg, httpCode);
  } else {
    Serial.printf("[NODE 2 ERR] Gagal kirim: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
