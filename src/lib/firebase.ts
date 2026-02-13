import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCwy8__FO0VK2fILXmyKltBKlfb2VzxU28",
  authDomain: "daily-game-notification.firebaseapp.com",
  projectId: "daily-game-notification",
  storageBucket: "daily-game-notification.firebasestorage.app",
  messagingSenderId: "442637117284",
  appId: "1:442637117284:web:95529665fd5cc52b2e7c71",
  measurementId: "G-7H25RLD2H6",
};

// ป้องกันการ Initialize ซ้ำ (Best Practice ใน Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ประกาศตัวแปร messaging ให้เป็น null ไว้ก่อน (เผื่อรันบน Server)
let messaging: Messaging | null = null;

// ตรวจสอบว่ารันอยู่บน Browser (Client) หรือไม่?
if (typeof window !== "undefined") {
  // ถ้าใช่ ค่อยดึง Messaging มาใช้งาน
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.error("Firebase Messaging failed to initialize", err);
  }
}

export { app, messaging };
