// استبدل القيم التالية بإعدادات مشروعك على Firebase Console
// Project Settings > General > Your apps > SDK setup and configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCPw14kUAz5OPoe70y_IvqFqieXN7EaL_I",
  authDomain: "my-tasks-147eb.firebaseapp.com",
  projectId: "my-tasks-147eb",
  storageBucket: "my-tasks-147eb.firebasestorage.app",
  messagingSenderId: "768177353472",
  appId: "1:768177353472:web:85189cb5463a4f25bdb9e5",
  measurementId: "G-20QG7N3B4F"
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
