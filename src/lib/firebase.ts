// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwKNWxEHvAlhqgjAm4fcjiEK3F1w9HLFo",
  authDomain: "jarvis-1d1f2.firebaseapp.com",
  projectId: "jarvis-1d1f2",
  storageBucket: "jarvis-1d1f2.firebasestorage.app",
  messagingSenderId: "776909765850",
  appId: "1:776909765850:web:8bb34382a21aa8bd4df9e3"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };