import cv2
import numpy as np
import pyzbar.pyzbar as pyzbar
import requests
import time

# Initialize laptop/device camera (index 0 is the default built-in webcam)
cap = cv2.VideoCapture(0)
font = cv2.FONT_HERSHEY_PLAIN

cv2.namedWindow("Laptop Webcam - SmartBus QR Scanner", cv2.WINDOW_AUTOSIZE)

FIREBASE_URL = "https://applied-electromechanics-cp-default-rtdb.firebaseio.com/system/last_validation.json?auth=cR5dtgscoJgToDv2H4kkPE9RcQOzcOSJd3jlfAlP"
 
prev=""
pres=""

print("Starting laptop camera scanner... Press ESC to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame from laptop camera.")
        time.sleep(0.5)
        continue
        
    decodedObjects = pyzbar.decode(frame)
    
    if len(decodedObjects) == 0:
        prev = ""
        
    for obj in decodedObjects:
        pres = obj.data.decode('utf-8')
        
        # Bounding box coordinates around decoded QR code
        points = obj.polygon
        if len(points) > 0:
            pts = np.array([point for point in points], dtype=np.int32)
            pts = pts.reshape((-1, 1, 2))
            cv2.polylines(frame, [pts], True, (0, 255, 0), 3) # draw green bounding box
            
        if prev == pres:
            pass
        else:
            print("Type:", obj.type)
            print("Data:", pres)
            prev = pres
            
            print("Sending to Firebase...")
            try:
                # Send as an object with a timestamp so Firebase registers a change even if the same QR is scanned twice
                payload = {"qr": pres, "timestamp": time.time()}
                response = requests.put(FIREBASE_URL, json=payload)
                if response.status_code == 200:
                    print("Successfully sent to Firebase!")
                else:
                    print(f"Failed to send: {response.text}")
            except Exception as e:
                print(f"Firebase error: {e}")

        cv2.putText(frame, str(pres), (50, 50), font, 2, (0, 255, 0), 2)
 
    cv2.imshow("Laptop Webcam - SmartBus QR Scanner", frame)
 
    key = cv2.waitKey(1)
    if key == 27: # ESC key
        break
 
cap.release()
cv2.destroyAllWindows()