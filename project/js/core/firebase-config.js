// استبدل القيم التالية بإعدادات مشروعك على Firebase Console
// Project Settings > General > Your apps > SDK setup and configuration
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// يتحقق إن كانت بيانات الإعداد ما زالت القيم الوهمية الافتراضية
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (value) => typeof value === "string" && value.startsWith("YOUR_")
);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// تفعيل العمل دون اتصال إنترنت (Offline Persistence)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Offline persistence not enabled:", err.code);
});
