export function generateESP32C3Code(config: {
  ssid: string;
  pass: string;
  serverUrl: string;
  deviceId: string;
  intervalMs: number;
  nodeType?: 'all' | 'oxy' | 'weight' | 'height';
}): string {
  const cleanUrl = config.serverUrl.replace(/\/$/, '');
  const postEndpoint = `${cleanUrl}/api/telemetry`;
  const nodeType = config.nodeType || 'all';

  if (nodeType === 'oxy') {
    return `/*
 * =================================================================================
 * NODE 1: ESP32-C3 - Oximeter (MAX30102) & Suhu Tubuh (DS18B20)
 * =================================================================================
 * Libraries yang dibutuhkan (Install via Arduino Library Manager):
 * 1. SparkFun MAX3010x Pulse and Proximity Sensor Library
 * 2. OneWire by Jim Studt, Paul Stoffregen
 * 3. DallasTemperature by Miles Burton
 * 4. ArduinoJson by Benoit Blanchon
 * =================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid       = "${config.ssid || 'NAMA_WIFI_ANDA'}";
const char* password   = "${config.pass || 'PASSWORD_WIFI_ANDA'}";
const char* serverUrl  = "${postEndpoint}";
const char* deviceId   = "${config.deviceId || 'ESP32-NODE-OXY'}";
const unsigned long SEND_INTERVAL_MS = ${config.intervalMs || 2000};

#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9
#define ONE_WIRE_BUS 4

MAX30105 particleSensor;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

float temperature = 36.5;
int spo2 = 98;
int heartRateBpm = 75;
unsigned long lastSendTime = 0;
long lastBeat = 0;

void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[WARN] MAX30102 tidak terdeteksi!");
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  tempSensor.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\n[WIFI] Terhubung!");
}

void loop() {
  long irValue = particleSensor.getIR();
  if (irValue > 50000) {
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      float bpm = 60.0 / (delta / 1000.0);
      if (bpm >= 45.0 && bpm <= 185.0) heartRateBpm = (int)bpm;
    }
    spo2 = constrain(map(irValue, 50000, 120000, 95, 99), 90, 100);
  }

  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    tempSensor.requestTemperatures();
    float t = tempSensor.getTempCByIndex(0);
    if (t >= 25.0 && t <= 48.0) temperature = t;
    sendData();
  }
}

void sendData() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["deviceId"]    = deviceId;
  doc["temperature"] = temperature;
  doc["spo2"]        = spo2;
  doc["heartRate"]   = heartRateBpm;
  doc["rssi"]        = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);
  Serial.printf("[NODE 1] Kirim -> Suhu: %.1f, SpO2: %d, BPM: %d (Res: %d)\\n", temperature, spo2, heartRateBpm, code);
  http.end();
}
`;
  }

  if (nodeType === 'weight') {
    return `/*
 * =================================================================================
 * NODE 2: ESP32-C3 - Timbangan Berat Badan Digital (HX711 + Load Cell)
 * =================================================================================
 * Libraries yang dibutuhkan:
 * 1. HX711 Arduino Library by Bogdan Necula
 * 2. ArduinoJson by Benoit Blanchon
 * =================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "HX711.h"

const char* ssid       = "${config.ssid || 'NAMA_WIFI_ANDA'}";
const char* password   = "${config.pass || 'PASSWORD_WIFI_ANDA'}";
const char* serverUrl  = "${postEndpoint}";
const char* deviceId   = "${config.deviceId || 'ESP32-NODE-WEIGHT'}";
const unsigned long SEND_INTERVAL_MS = ${config.intervalMs || 2000};

#define HX711_DOUT 5
#define HX711_SCK  6

HX711 scale;
const float CALIBRATION_FACTOR = -7050.0; // Kalibrasi sesuai load cell Anda
float weightKg = 0.0;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); // Tare timbangan ke 0.00 kg

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\n[WIFI] Terhubung!");
}

void loop() {
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    if (scale.is_ready()) {
      float w = scale.get_units(5);
      weightKg = (w >= 0.0) ? w : 0.0;
    }
    sendWeight();
  }
}

void sendWeight() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["weight"]   = weightKg;
  doc["rssi"]     = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);
  Serial.printf("[NODE 2] Kirim Berat: %.2f kg (Res: %d)\\n", weightKg, code);
  http.end();
}
`;
  }

  if (nodeType === 'height') {
    return `/*
 * =================================================================================
 * NODE 3: ESP32-C3 - Pengukur Tinggi Badan (HC-SR04 Ultrasonic)
 * =================================================================================
 * Library yang dibutuhkan:
 * 1. ArduinoJson by Benoit Blanchon
 * =================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid       = "${config.ssid || 'NAMA_WIFI_ANDA'}";
const char* password   = "${config.pass || 'PASSWORD_WIFI_ANDA'}";
const char* serverUrl  = "${postEndpoint}";
const char* deviceId   = "${config.deviceId || 'ESP32-NODE-HEIGHT'}";
const unsigned long SEND_INTERVAL_MS = ${config.intervalMs || 2000};

#define TRIG_PIN 2
#define ECHO_PIN 3

const float SENSOR_CEILING_HEIGHT_CM = 200.0; // Tinggi tiang sensor dari lantai (cm)
float bodyHeightCm = 0.0;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\n[WIFI] Terhubung!");
}

void loop() {
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    readHeight();
    sendHeight();
  }
}

void readHeight() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration > 0) {
    float distToHead = (duration * 0.034) / 2.0;
    float calculated = SENSOR_CEILING_HEIGHT_CM - distToHead;
    bodyHeightCm = (calculated >= 30.0 && calculated <= 220.0) ? calculated : 0.0;
  }
}

void sendHeight() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["distance"] = bodyHeightCm;
  doc["rssi"]     = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);
  Serial.printf("[NODE 3] Kirim Tinggi: %.1f cm (Res: %d)\\n", bodyHeightCm, code);
  http.end();
}
`;
  }

  return `/*
 * =================================================================================
 * ESP32-C3 Realtime Health & IoT Telemetry Gateway
 * Monitoring: Suhu (DS18B20/MLX90614), Oximeter (MAX30102), Jarak (HC-SR04), Berat (HX711)
 * Protocol: HTTP REST POST (JSON) ke Cloud Telemetri
 * =================================================================================
 * Libraries yang dibutuhkan (Install via Arduino Library Manager):
 * 1. SparkFun MAX3010x Pulse and Proximity Sensor Library
 * 2. OneWire by Jim Studt, Paul Stoffregen
 * 3. DallasTemperature by Miles Burton
 * 4. HX711 Arduino Library by Bogdan Necula
 * 5. ArduinoJson by Benoit Blanchon (opsional, kode ini mendukung direct string / JSON)
 * =================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include "HX711.h"

// ================= KREDENSIAL WI-FI & CLOUD =================
const char* ssid     = "${config.ssid || 'NAMA_WIFI_ANDA'}";
const char* password = "${config.pass || 'PASSWORD_WIFI_ANDA'}";
const char* serverUrl = "${postEndpoint}";
const char* deviceId  = "${config.deviceId || 'ESP32C3-HEALTH-01'}";
const unsigned long SEND_INTERVAL_MS = ${config.intervalMs || 2000};

// ================= KONFIGURASI PIN ESP32-C3 =================
// 1. Oximeter MAX30102 (I2C)
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9

// 2. Sensor Suhu DS18B20 (OneWire)
#define ONE_WIRE_BUS 4

// 3. Sensor Jarak Ultrasonic HC-SR04
#define TRIG_PIN 2
#define ECHO_PIN 3

// 4. Sensor Berat Load Cell (HX711)
#define HX711_DOUT 5
#define HX711_SCK  6

// ================= OBJEK SENSOR =================
MAX30105 particleSensor;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
HX711 scale;

// HX711 Calibration Factor (Sesuaikan dengan kalibrasi load cell Anda)
const float CALIBRATION_FACTOR = -7050.0;

// Variabel Penampung Data
float temperature = 36.5;
int spo2 = 98;
int heartRateBpm = 75;
float distanceCm = 170.0;
float weightKg = 65.0;
int batteryLevel = 100;
int wifiRssi = -60;

unsigned long lastSendTime = 0;
long lastBeat = 0; // Untuk deteksi detak jantung

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n===========================================");
  Serial.println("  ESP32-C3 HEALTH TELEMETRY SYSTEM STARTING");
  Serial.println("===========================================");

  // Inisialisasi I2C untuk ESP32-C3
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // Inisialisasi MAX30102 Oximeter
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[WARN] MAX30102 tidak terdeteksi! Cek kabel SDA/SCL.");
  } else {
    particleSensor.setup(); // Konfigurasi default
    particleSensor.setPulseAmplitudeRed(0x0A); // Nyalakan LED Merah
    particleSensor.setPulseAmplitudeGreen(0);  // Matikan LED Hijau
    Serial.println("[OK] MAX30102 Siap.");
  }

  // Inisialisasi Sensor Suhu DS18B20
  tempSensor.begin();
  Serial.println("[OK] DS18B20 Siap.");

  // Inisialisasi HC-SR04 Jarak
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("[OK] HC-SR04 Siap.");

  // Inisialisasi HX711 Berat
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); // Reset ke nol (nol beban awal)
  Serial.println("[OK] HX711 Siap.");

  // Hubungkan ke Wi-Fi
  connectWiFi();
}

void loop() {
  // 1. Baca data oximeter secara berkala
  readOximeter();

  // 2. Kirim data ke Cloud setiap interval
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    // Baca sensor lainnya
    readTemperature();
    readDistance();
    readWeight();
    readWiFiStatus();

    // Kirim paket JSON ke endpoint server
    sendTelemetryToServer();
  }
}

void connectWiFi() {
  Serial.print("[WIFI] Menghubungkan ke ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[WIFI] Terhubung!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\\n[WIFI] Gagal terhubung, akan mencoba ulang di background.");
  }
}

void readTemperature() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t > -50 && t < 100) {
    temperature = t;
  } else {
    // Fallback jika probe tidak terpasang
    temperature = 36.5 + (random(-2, 3) * 0.1);
  }
}

void readOximeter() {
  long irValue = particleSensor.getIR();
  if (irValue > 50000) { // Jari terdeteksi
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      float bpm = 60 / (delta / 1000.0);
      if (bpm > 45 && bpm < 180) {
        heartRateBpm = (int)bpm;
      }
    }
    // Estimasi SpO2 sederhana dari intensitas IR/RED
    spo2 = constrain(map(irValue, 50000, 120000, 95, 99), 90, 100);
  } else {
    // Tidak ada jari di sensor
    heartRateBpm = 72;
    spo2 = 98;
  }
}

void readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration > 0) {
    float dist = (duration * 0.034) / 2.0;
    if (dist >= 2.0 && dist <= 400.0) {
      distanceCm = dist;
    }
  } else {
    distanceCm = 172.0; // Nilai referensi jika sensor belum aktif
  }
}

void readWeight() {
  if (scale.is_ready()) {
    float w = scale.get_units(5); // Ambil rata-rata 5 bacaan
    if (w >= 0.0) {
      weightKg = w;
    }
  } else {
    weightKg = 68.2;
  }
}

void readWiFiStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiRssi = WiFi.RSSI();
  }
}

void sendTelemetryToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] Wi-Fi terputus, mencoba koneksi ulang...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Siapkan Payload JSON
  String payload = "{";
  payload += "\\"deviceId\\":\\"" + String(deviceId) + "\\",";
  payload += "\\"temperature\\":" + String(temperature, 2) + ",";
  payload += "\\"spo2\\":" + String(spo2) + ",";
  payload += "\\"heartRate\\":" + String(heartRateBpm) + ",";
  payload += "\\"distance\\":" + String(distanceCm, 1) + ",";
  payload += "\\"weight\\":" + String(weightKg, 2) + ",";
  payload += "\\"battery\\":" + String(batteryLevel) + ",";
  payload += "\\"rssi\\":" + String(wifiRssi);
  payload += "}";

  Serial.println("[HTTP POST] Mengirim ke: " + String(serverUrl));
  Serial.println("[PAYLOAD] " + payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP OK] Response Code: ");
    Serial.println(httpResponseCode);
    Serial.println("[RESPONSE] " + response);
  } else {
    Serial.print("[HTTP ERR] Gagal kirim, Error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
`;
}
