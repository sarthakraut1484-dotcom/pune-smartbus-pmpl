#include <Arduino.h>
#include <ESP32QRCodeReader.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WebServer.h>
#include "img_converters.h"
#include "soc/soc.h"           // Brownout detector
#include "soc/rtc_cntl_reg.h"  // Brownout detector

// Provide the token generation process info.
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// --- WIFI & FIREBASE CONFIG ---
#define WIFI_SSID "Sarthak_Raut"
#define WIFI_PASSWORD "qwertyuiop"
#define DATABASE_SECRET "cR5dtgscoJgToDv2H4kkPE9RcQOzcOSJd3jlfAlP" // Added your secret!
#define DATABASE_URL "https://applied-electromechanics-cp-default-rtdb.firebaseio.com/" 

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Initialize the QR Code reader with the AI Thinker camera model
ESP32QRCodeReader reader(CAMERA_MODEL_AI_THINKER);

WebServer server(80);

bool ipPublished = false; // Tracks if IP has been published to Firebase successfully

// Global function handlers to prevent local scope stack corruption on setup() exit
void serveJpg() {
  Serial.println("📸 WebServer: Video request received.");
  
  // Add CORS & Private Network Access (PNA) headers to pass Brave/Chrome security checks
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ WebServer: esp_camera_fb_get returned NULL!");
    server.send(500, "text/plain", "Camera Capture Failed");
    return;
  }
  
  uint8_t * out_buf = NULL;
  size_t out_len = 0;
  // Convert grayscale frame to standard JPEG format
  bool converted = frame2jpg(fb, 80, &out_buf, &out_len);
  esp_camera_fb_return(fb); // Release camera buffer immediately
  
  if (converted) {
    server.setContentLength(out_len);
    server.send(200, "image/jpeg", "");
    WiFiClient client = server.client();
    size_t written = client.write(out_buf, out_len);
    free(out_buf); // Free allocated JPEG buffer
    Serial.printf("✅ WebServer: Sent JPEG stream to client (%d bytes).\n", written);
  } else {
    Serial.println("❌ WebServer: Grayscale to JPEG conversion failed!");
    server.send(500, "text/plain", "JPEG Compression Failed");
  }
}

void serveOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
  server.send(204); // No content
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
  Serial.begin(115200);
  delay(1000); // Give serial monitor time to catch up
  Serial.println("\n\nESP32-CAM QR Scanner Starting...");

  // Setup WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected with IP: ");
  Serial.println(WiFi.localIP());

  // Setup Firebase
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Setup the reader
  QRCodeReaderSetupErr setupErr = reader.setup();
  if (setupErr != SETUP_OK) {
    Serial.print("❌ ERROR: Camera setup failed with code: ");
    Serial.println(setupErr);
    Serial.println("Troubleshooting tips:");
    Serial.println("1. Check if the camera ribbon cable is firmly and straightly inserted.");
    Serial.println("2. Make sure the black latch of the connector is clicked down.");
    Serial.println("3. Ensure the ESP32-CAM is powered by a solid 5V source (not 3.3V) with enough current.");
    while (true); // Stop here forever
  }
  
  reader.begin();

  // Publish dynamic IP to Firebase so the Admin Panel connects automatically
  if (Firebase.ready()) {
    String ipStr = WiFi.localIP().toString();
    Firebase.RTDB.setString(&fbdo, "/system/cam_ip", ipStr);
    Serial.println("Published Camera IP to Firebase: " + ipStr);
  }

  // Setup Web Server endpoints to serve live video feed to Admin Panel
  server.on("/cam-hi.jpg", HTTP_GET, serveJpg);
  server.on("/cam-lo.jpg", HTTP_GET, serveJpg);
  server.on("/cam-mid.jpg", HTTP_GET, serveJpg);
  
  server.on("/cam-hi.jpg", HTTP_OPTIONS, serveOptions);
  server.on("/cam-lo.jpg", HTTP_OPTIONS, serveOptions);
  server.on("/cam-mid.jpg", HTTP_OPTIONS, serveOptions);
  server.begin();
  Serial.println("HTTP Web Server Started on Port 80");

  Serial.println("✅ Camera & Firebase Ready! Point at a QR Code.");
}

void loop() {
  server.handleClient(); // Handle incoming live feed requests

  // Self-healing: Retry publishing IP if it wasn't ready during setup
  if (!ipPublished && Firebase.ready()) {
    String ipStr = WiFi.localIP().toString();
    if (Firebase.RTDB.setString(&fbdo, "/system/cam_ip", ipStr)) {
      ipPublished = true;
      Serial.println("🌐 Dynamic IP registered on Firebase: " + ipStr);
    }
  }
  
  struct QRCodeData qrCodeData;
  
  // Poll for a QR code from the background task queue
  if (reader.receiveQrCode(&qrCodeData, 100)) {
    if (qrCodeData.valid) {
      String payloadStr = (const char *)qrCodeData.payload;
      Serial.print("QR Found: ");
      Serial.println(payloadStr);

      if (Firebase.ready()) {
        if (Firebase.RTDB.setString(&fbdo, "/system/last_validation", payloadStr)) {
          Serial.println("Successfully sent to Firebase!");
        } else {
          Serial.println("Failed to send: " + fbdo.errorReason());
        }
      }
    }
  }
}
