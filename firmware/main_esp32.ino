#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// --- TFT SCREEN & GRAPHICS LIBRARIES ---
#include <Adafruit_GFX.h>      // Core graphics library
#include <Adafruit_ST7789.h>   // Hardware-specific library for ST7789 (240x320)
#include <SPI.h>
#include "qrcodegen.h"            // Project Nayuki C QR Code Generator library

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

// --- TFT PIN CONFIGURATIONS (SPI) ---
#define TFT_CS     15
#define TFT_RST    4
#define TFT_DC     2
// Note: standard VSPI pins on ESP32 are:
// MOSI -> GPIO 23
// SCLK -> GPIO 18
// MISO -> GPIO 19 (Unused for display output)

// --- FAIL-SAFE TFT COLOR CONSTANTS (16-bit 565 format) ---
#define TFT_BLACK   0x0000
#define TFT_BLUE    0x001F
#define TFT_RED     0xF800
#define TFT_GREEN   0x03E0 // Emerald green
#define TFT_CYAN    0x07FF
#define TFT_YELLOW  0xFFE0
#define TFT_WHITE   0xFFFF

// --- 3. GLOBAL VARIABLES ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

int currentOccupancy = 0;
int totalEntries = 0;
int totalExits = 0;
int unbookedCount = 0; // Synchronized unbooked riders count

unsigned long lastUpdate = 0;
const long updateInterval = 2000; // Sync to Firebase every 2 seconds

// TFT Display object for ST7789 (240x320)
Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);

// Alternating Screen Display state
unsigned long lastDisplaySwitch = 0;
const long displaySwitchInterval = 5000; // Alternate display every 5 seconds
bool showingQRCode = true;

// --- 4. TFT DRAWING HELPER FUNCTIONS ---

// Draw dynamic dynamic booking QR code screen
void drawQRCodeScreen() {
  tft.fillScreen(TFT_BLACK);
  
  // High-tech neon outer border
  tft.drawRect(0, 0, tft.width(), tft.height(), TFT_BLUE);
  // Glowing cyan corner brackets
  int pad = 0;
  tft.fillRect(pad, pad, 15, 4, TFT_CYAN);
  tft.fillRect(pad, pad, 4, 15, TFT_CYAN);
  tft.fillRect(tft.width() - 15 - pad, pad, 15, 4, TFT_CYAN);
  tft.fillRect(tft.width() - 4 - pad, pad, 4, 15, TFT_CYAN);
  tft.fillRect(pad, tft.height() - 4 - pad, 15, 4, TFT_CYAN);
  tft.fillRect(pad, tft.height() - 15 - pad, 4, 15, TFT_CYAN);
  tft.fillRect(tft.width() - 15 - pad, tft.height() - 4 - pad, 15, 4, TFT_CYAN);
  tft.fillRect(tft.width() - 4 - pad, tft.height() - 15 - pad, 4, 15, TFT_CYAN);

  // Title header text - dynamically scaled & centered based on screen size!
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  bool isLarge = tft.width() > 160;
  tft.setTextSize(isLarge ? 2 : 1);
  int titleY = isLarge ? 12 : 8;
  // In size 1, char is 6px wide. In size 2, char is 12px wide.
  int titleWidth = 19 * (isLarge ? 12 : 6);
  tft.setCursor((tft.width() - titleWidth) / 2, titleY);
  tft.print("SCAN TO BOOK TICKET");

  // Dynamic QR Code generation using qrcodegen.h
  uint8_t qrCode[qrcodegen_BUFFER_LEN_FOR_VERSION(10)];
  uint8_t tempBuffer[qrcodegen_BUFFER_LEN_FOR_VERSION(10)];
  
  bool ok = qrcodegen_encodeText("https://pune-smartbus-pmpl.vercel.app/book",
                                 tempBuffer, qrCode,
                                 qrcodegen_Ecc_LOW,
                                 1, 10,
                                 qrcodegen_Mask_AUTO, true);
  
  if (ok) {
    int size = qrcodegen_getSize(qrCode);
    // Dynamically calculate optimum scaling to stretch QR code beautifully full screen!
    int topReserved = isLarge ? 40 : 24;
    int scale = (tft.height() - topReserved - 8) / size;
    if (scale < 1) scale = 1;
    
    int offsetX = (tft.width() - size * scale) / 2;
    int offsetY = topReserved + (tft.height() - topReserved - size * scale) / 2;
    
    for (int y = 0; y < size; y++) {
      for (int x = 0; x < size; x++) {
        uint16_t color = qrcodegen_getModule(qrCode, x, y) ? TFT_WHITE : TFT_BLACK;
        tft.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale, color);
      }
    }
  }
}

// Draw warning alerts or secure OK compliance layouts
void drawAlertScreen() {
  bool isLarge = tft.width() > 160;
  
  if (unbookedCount > 0) {
    // Crimson caution screen
    tft.fillScreen(TFT_RED);
    
    // Warning Header
    tft.setTextColor(TFT_WHITE, TFT_RED);
    tft.setTextSize(isLarge ? 3 : 2);
    tft.setCursor(isLarge ? 80 : 32, isLarge ? 25 : 12);
    tft.print("WARNING!");
    
    // Warning Symbol
    int triX = isLarge ? 160 : 80;
    int triY = isLarge ? 65 : 36;
    tft.drawTriangle(triX, triY, triX - 16, triY + 24, triX + 16, triY + 24, TFT_YELLOW);
    tft.setTextColor(TFT_YELLOW, TFT_RED);
    tft.setTextSize(isLarge ? 2 : 1);
    tft.setCursor(triX - (isLarge ? 4 : 2), triY + (isLarge ? 6 : 8));
    tft.print("!");
    
    // Alert Details
    tft.setTextColor(TFT_WHITE, TFT_RED);
    tft.setTextSize(isLarge ? 2 : 1);
    tft.setCursor(isLarge ? 40 : 14, isLarge ? 115 : 65);
    tft.print("UNBOOKED RIDERS: ");
    tft.setTextSize(isLarge ? 3 : 2);
    tft.setTextColor(TFT_YELLOW, TFT_RED);
    tft.print(unbookedCount);
    
    tft.setTextSize(isLarge ? 2 : 1);
    tft.setTextColor(TFT_WHITE, TFT_RED);
    tft.setCursor(isLarge ? 24 : 8, isLarge ? 155 : 88);
    tft.println("Please scan the QR code");
    tft.setCursor(isLarge ? 24 : 8, isLarge ? 175 : 100);
    tft.println("and book your ticket");
    tft.setCursor(isLarge ? 24 : 8, isLarge ? 195 : 112);
    tft.println("IMMEDIATELY!");
  } else {
    // Emerald green verified screen (RGB 0, 120, 0 in 565 format)
    tft.fillScreen(TFT_GREEN); 
    
    tft.setTextColor(TFT_WHITE, TFT_GREEN);
    tft.setTextSize(isLarge ? 3 : 2);
    tft.setCursor(isLarge ? 65 : 28, isLarge ? 25 : 15);
    tft.print("TICKETS OK");
    
    tft.setTextSize(isLarge ? 2 : 1);
    tft.setCursor(isLarge ? 24 : 12, isLarge ? 70 : 48);
    tft.println("ALL PASSENGERS VALIDATED");
    tft.setCursor(isLarge ? 24 : 12, isLarge ? 100 : 68);
    tft.println("Thank you for booking");
    tft.setCursor(isLarge ? 24 : 12, isLarge ? 118 : 80);
    tft.println("with PMPL SmartBus!");
    
    // Delightful premium smiley face representation
    int faceX = isLarge ? 160 : 80;
    int faceY = isLarge ? 175 : 106;
    int faceR = isLarge ? 20 : 12;
    tft.drawCircle(faceX, faceY, faceR, TFT_WHITE);
    tft.fillCircle(faceX - (isLarge ? 7 : 4), faceY - (isLarge ? 6 : 4), isLarge ? 3 : 2, TFT_WHITE);
    tft.fillCircle(faceX + (isLarge ? 7 : 4), faceY - (isLarge ? 6 : 4), isLarge ? 3 : 2, TFT_WHITE);
    
    // Draw smile curve
    if (isLarge) {
      tft.drawPixel(faceX - 6, faceY + 4, TFT_WHITE);
      tft.drawPixel(faceX - 5, faceY + 5, TFT_WHITE);
      tft.drawPixel(faceX - 4, faceY + 6, TFT_WHITE);
      tft.drawPixel(faceX - 3, faceY + 7, TFT_WHITE);
      tft.drawPixel(faceX - 2, faceY + 8, TFT_WHITE);
      tft.drawPixel(faceX - 1, faceY + 9, TFT_WHITE);
      tft.drawPixel(faceX,     faceY + 9, TFT_WHITE);
      tft.drawPixel(faceX + 1, faceY + 9, TFT_WHITE);
      tft.drawPixel(faceX + 2, faceY + 8, TFT_WHITE);
      tft.drawPixel(faceX + 3, faceY + 7, TFT_WHITE);
      tft.drawPixel(faceX + 4, faceY + 6, TFT_WHITE);
      tft.drawPixel(faceX + 5, faceY + 5, TFT_WHITE);
      tft.drawPixel(faceX + 6, faceY + 4, TFT_WHITE);
    } else {
      tft.drawPixel(faceX - 3, faceY + 2, TFT_WHITE);
      tft.drawPixel(faceX - 2, faceY + 3, TFT_WHITE);
      tft.drawPixel(faceX - 1, faceY + 4, TFT_WHITE);
      tft.drawPixel(faceX,     faceY + 4, TFT_WHITE);
      tft.drawPixel(faceX + 1, faceY + 4, TFT_WHITE);
      tft.drawPixel(faceX + 2, faceY + 3, TFT_WHITE);
      tft.drawPixel(faceX + 3, faceY + 2, TFT_WHITE);
    }
  }
}

// --- 5. SETUP ---
void setup() {
  Serial.begin(115200);      // Debugging
  Serial2.begin(115200, SERIAL_8N1, 16, 17); // Communication with ESP32-CAM

  pinMode(IR_ENTRY, INPUT);
  pinMode(IR_EXIT, INPUT);

  // Initialize TFT Screen (ST7789 240x320)
  tft.init(240, 320);
  tft.setRotation(1); // Set landscape layout
  tft.fillScreen(TFT_BLACK);

  // Initial High-Tech Boot Banner
  tft.setTextColor(TFT_CYAN);
  tft.setTextSize(2);
  tft.setCursor(20, 20);
  tft.println("PMPL SmartBus");
  tft.setTextColor(TFT_WHITE);
  tft.setTextSize(1.5);
  tft.println("\n  Initializing WiFi Connection...");

  // WiFi Setup
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected with IP: " + WiFi.localIP().toString());
  
  tft.setTextColor(TFT_GREEN);
  tft.println("\n  WiFi Connected Successfully!");
  tft.setTextColor(TFT_WHITE);
  tft.println("  Linking with Firebase RTDB...");

  // Firebase Setup
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized with Secret");

  tft.setTextColor(TFT_GREEN);
  tft.println("\n  Firebase Link Established!");
  delay(1200); // Allow startup confirmation to sit brief

  // Render initial screen state
  drawQRCodeScreen();
}

void updateFirebase() {
  if (Firebase.ready() && (millis() - lastUpdate > updateInterval)) {
    lastUpdate = millis();
    
    // --- 1. SINGLE OPTIMIZED READ FOR ALL STATS ---
    int remoteEntries = -1;
    int remoteUnbooked = 0;
    
    if (Firebase.RTDB.getJSON(&fbdo, "/stats")) {
      FirebaseJsonData result;
      FirebaseJson &json = fbdo.jsonObject();
      
      if (json.get(result, "total_entries")) {
        remoteEntries = result.intValue;
      }
      if (json.get(result, "unbooked_count")) {
        remoteUnbooked = result.intValue;
      }
    } else {
      Serial.print("❌ JSON Read Failed: ");
      Serial.println(fbdo.errorReason());
    }
    
    // --- 2. ROBUST WEB ADMIN RESET HANDLER ---
    if (remoteEntries == 0) {
      if (currentOccupancy != 0 || totalEntries != 0 || totalExits != 0 || unbookedCount != 0) {
        currentOccupancy = 0;
        totalEntries = 0;
        totalExits = 0;
        unbookedCount = 0;
        Serial.println("🔄 Web Admin Reset Detected: Resetting local counts and display to 0!");
        
        // Update screen state immediately on hard reset
        if (showingQRCode) {
          drawQRCodeScreen();
        } else {
          drawAlertScreen();
        }
        return; // Skip write in this cycle to let Firebase stabilize
      }
    }
    
    // --- 3. DYNAMIC UNBOOKED COUNT SYNC & DRAW HINTS ---
    if (remoteUnbooked != unbookedCount) {
      unbookedCount = remoteUnbooked;
      // Force an immediate TFT redraw if currently presenting the alert screen
      if (!showingQRCode) {
        drawAlertScreen();
      }
    }
    
    // --- 4. SINGLE OPTIMIZED WRITE FOR ALL TELEMETRY ---
    FirebaseJson updateJson;
    updateJson.set("current_occupancy", currentOccupancy);
    updateJson.set("total_entries", totalEntries);
    updateJson.set("total_exits", totalExits);
    
    if (Firebase.RTDB.updateNode(&fbdo, "/stats", &updateJson)) {
      Serial.println("✅ Sync Success: " + String(currentOccupancy) + " riders | Unbooked: " + String(unbookedCount));
    } else {
      Serial.print("❌ Sync Failed: ");
      Serial.println(fbdo.errorReason());
    }
  }
}

// --- 7. MAIN LOOP ---
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

  // Camera handling (Serial2 validation log forwarder)
  if (Serial2.available()) {
    String qrResult = Serial2.readStringUntil('\n');
    qrResult.trim();
    if (qrResult.length() > 0 && Firebase.ready()) {
      Firebase.RTDB.setString(&fbdo, "/system/last_validation", qrResult);
    }
  }

  // --- NON-BLOCKING ALTERNATING DISPLAY MANAGER ---
  unsigned long now = millis();
  if (now - lastDisplaySwitch > displaySwitchInterval) {
    lastDisplaySwitch = now;
    showingQRCode = !showingQRCode;
    if (showingQRCode) {
      drawQRCodeScreen();
    } else {
      drawAlertScreen();
    }
  }
}
