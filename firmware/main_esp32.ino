#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Provide the token generation process info.
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// --- 1. WIFI & FIREBASE CONFIG ---
#define WIFI_SSID "Sarthak_Raut"
#define WIFI_PASSWORD "qwertyuiop"
#define DATABASE_SECRET "cR5dtgscoJgToDv2H4kkPE9RcQOzcOSJd3jlfAlP"
#define DATABASE_URL "https://applied-electromechanics-cp-default-rtdb.firebaseio.com/" 

// --- 2. PIN DEFINITIONS ---
#define IR_ENTRY 34   // Sensor 1 (Outer)
#define IR_EXIT 35    // Sensor 2 (Inner)

// --- 3. GLOBAL VARIABLES ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

int currentOccupancy = 0;
int totalEntries = 0;
int totalExits = 0;

unsigned long lastUpdate = 0;
const long updateInterval = 2000; // Sync to Firebase every 2 seconds

// --- 4. SETUP ---
void setup() {
  Serial.begin(115200);      // Debugging
  Serial2.begin(115200, SERIAL_8N1, 16, 17); // Communication with ESP32-CAM

  pinMode(IR_ENTRY, INPUT);
  pinMode(IR_EXIT, INPUT);

  // WiFi Setup
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected with IP: " + WiFi.localIP().toString());

  // Firebase Setup
  // Firebase Setup
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized with Secret");
}

// --- 5. LOGIC HELPERS ---
void updateFirebase() {
  if (Firebase.ready() && (millis() - lastUpdate > updateInterval)) {
    lastUpdate = millis();
    
    // Check if database has been reset by the Web Admin
    int remoteEntries = -1;
    if (Firebase.RTDB.getInt(&fbdo, "/stats/total_entries")) {
      if (fbdo.dataType() == "int") {
        remoteEntries = fbdo.to<int>();
      }
    }
    
    // If database was reset to 0 but local totalEntries is still positive, synchronise
    if (remoteEntries == 0 && totalEntries > 0) {
      currentOccupancy = 0;
      totalEntries = 0;
      totalExits = 0;
      Serial.println("🔄 Web Admin Reset Detected: Resetting local counts to 0!");
      return;
    }
    
    bool success = true;
    success &= Firebase.RTDB.setInt(&fbdo, "/stats/current_occupancy", currentOccupancy);
    success &= Firebase.RTDB.setInt(&fbdo, "/stats/total_entries", totalEntries);
    success &= Firebase.RTDB.setInt(&fbdo, "/stats/total_exits", totalExits);
    
    if (success) {
      Serial.println("✅ Sync Success: " + String(currentOccupancy) + " riders");
    } else {
      Serial.print("❌ Sync Failed: ");
      Serial.println(fbdo.errorReason());
    }
  }
}

// --- 6. MAIN LOOP ---
void loop() {
  updateFirebase();

  // --- INDEPENDENT ENTRY GATE (34) ---
  if (digitalRead(IR_ENTRY) == LOW) {
    currentOccupancy++;
    totalEntries++;
    Serial.println(">>> ENTRY | Count: " + String(currentOccupancy));
    
    // SAFE SYNC
    if (Firebase.ready()) {
      Firebase.RTDB.setInt(&fbdo, "/stats/current_occupancy", currentOccupancy);
      Firebase.RTDB.setInt(&fbdo, "/stats/total_entries", totalEntries);
    }
    
    delay(500); // Small debounce
  }

  // --- INDEPENDENT EXIT GATE (35) ---
  if (digitalRead(IR_EXIT) == LOW) {
    if (currentOccupancy > 0) currentOccupancy--;
    totalExits++;
    Serial.println("<<< EXIT | Count: " + String(currentOccupancy));
    
    // SAFE SYNC
    if (Firebase.ready()) {
      Firebase.RTDB.setInt(&fbdo, "/stats/current_occupancy", currentOccupancy);
      Firebase.RTDB.setInt(&fbdo, "/stats/total_exits", totalExits);
    }
    
    delay(500); // Small debounce
  }

  // Camera handling (Serial2)
  if (Serial2.available()) {
    String qrResult = Serial2.readStringUntil('\n');
    qrResult.trim();
    if (qrResult.length() > 0 && Firebase.ready()) {
      Firebase.RTDB.setString(&fbdo, "/system/last_validation", qrResult);
    }
  }
}
