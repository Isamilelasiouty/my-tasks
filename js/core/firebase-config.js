// استبدل القيم التالية بإعدادات مشروعك على Firebase Console
// Project Settings > General > Your apps > SDK setup and configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBTpvluZ2Yq6-o_8lqT6RuK-wEYAj3ewkc",
  authDomain: "seo-tool-493120.firebaseapp.com",
  projectId: "seo-tool-493120",
  storageBucket: "seo-tool-493120.firebasestorage.app",
  messagingSenderId: "375171116080",
  appId: "1:375171116080:web:4a7af07c6637ca63df91f5"
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
