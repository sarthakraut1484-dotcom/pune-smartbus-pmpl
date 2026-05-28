import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDJ6ktvaNxLv57yyvVFBionA16JNtbjNlo",
  authDomain: "applied-electromechanics-cp.firebaseapp.com",
  databaseURL: "https://applied-electromechanics-cp-default-rtdb.firebaseio.com",
  projectId: "applied-electromechanics-cp",
  storageBucket: "applied-electromechanics-cp.firebasestorage.app",
  messagingSenderId: "172431076476",
  appId: "1:172431076476:web:eea2f404de78f5e52eadf9",
  measurementId: "G-TNC1VW068W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
