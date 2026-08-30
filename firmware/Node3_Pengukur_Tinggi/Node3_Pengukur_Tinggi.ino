/* =================================================================================
 * PROYEK SMART HEALTH POSYANDU IOT
 * NODE 3: ESP32-C3 - Pengukur Tinggi Badan Digital (HC-SR04 Ultrasonic)
 * 
 * Deskripsi:
 * Mengukur tinggi badan anak/pasien menggunakan sensor ultrasonik HC-SR04 yang dipasang di tiang atas.
 * Rumus: Tinggi Badan = Tinggi Tiang Plafon (misal 200 cm) - Jarak ke Kepala.
 * Mengirim payload khusus Tinggi Badan (distance) ke server (tidak menimpa data suhu/oxymeter/berat).
 * 
 * Library yang Dibutuhkan (Install via Arduino Library Manager):
 * 1. ArduinoJson by Benoit Blanchon
 * 
 * Pinout ESP32-C3:
 * - HC-SR04 TRIG -> Pin 2
 * - HC-SR04 ECHO -> Pin 3
 * - VCC -> 5V, GND -> GND
 * ================================================================================= */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================= PENGATURAN WI-FI & SERVER =================
const char* ssid       = "NAMA_WIFI_ANDA";
const char* password   = "PASSWORD_WIFI_ANDA";
const char* serverUrl  = "https://smart-health-posyandu.vercel.app/api/telemetry";
const char* deviceId   = "ESP32-NODE-HEIGHT";
const unsigned long SEND_INTERVAL_MS = 2000; // Kirim data tiap 2 detik

// ================= PINOUT ESP32-C3 =================
#define TRIG_PIN 2
#define ECHO_PIN 3

// ================= KONFIGURASI TINGGI TIANG SENSOR =================
// Ukur jarak dari permukaan lantai ke posisi sensor ultrasonik (dalam cm)
// Contoh: Sensor dipasang di tiang pengukur setinggi 200.0 cm
const float SENSOR_CEILING_HEIGHT_CM = 200.0;

float bodyHeightCm = 0.0;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  [NODE 3] PENGUKUR TINGGI POSYANDU STARTING");
  Serial.println("=============================================");

  // Inisialisasi Pin Ultrasonik
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  Serial.println("[OK] Sensor Ultrasonik HC-SR04 Siap.");

  // Hubungkan ke Wi-Fi
  connectWiFi();
}

void loop() {
  // Kirim data berkala
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    readBodyHeight();
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

void readBodyHeight() {
  // Trigger pulsa ultrasonik 10 microsecond
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Baca pantulan gelombang (timeout 30ms = ~5 meter)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  if (duration > 0) {
    // Hitung jarak dari sensor ke ujung kepala (kecepatan suara = 0.034 cm/us)
    float distanceToHead = (duration * 0.034) / 2.0;

    // Tinggi badan = Tinggi tiang - jarak ke kepala
    float calculatedHeight = SENSOR_CEILING_HEIGHT_CM - distanceToHead;

    // Filter batas wajar tinggi badan manusia/balita (30 cm s/d 220 cm)
    if (calculatedHeight >= 30.0 && calculatedHeight <= 220.0) {
      bodyHeightCm = calculatedHeight;
    } else {
      // Jika tidak ada orang di bawah tiang
      bodyHeightCm = 0.0;
    }
  } else {
    Serial.println("[WARN] HC-SR04 Timeout (Tidak ada pantulan).");
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

  // PAYLOAD KHUSUS NODE 3 (HANYA MENGIRIM TINGGI BADAN / DISTANCE)
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["distance"] = bodyHeightCm;
  doc["rssi"]     = WiFi.RSSI();

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.printf("[NODE 3 POST OK] Tinggi Badan: %.1f cm (Kode: %d)\n", bodyHeightCm, httpCode);
  } else {
    Serial.printf("[NODE 3 ERR] Gagal kirim: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
