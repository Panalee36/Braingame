// src/utils/requestNotification.ts

import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";

export async function requestNotificationPermission() {
  // ✅ 1. เพิ่ม "ตัวกัน" (Guard Clause) ตรงนี้
  // ถ้าไม่มี messaging (แปลว่าอยู่บน Server หรือ Browser ไม่รองรับ) ให้จบการทำงานเลย
  if (!messaging) {
    console.log("Not supported or Server-side rendering.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // โค้ดเดิมของคุณ ...
      const token = await getToken(messaging, {
        vapidKey:
          "BMOQmPR1Jfg0XbQ4saY31UVN9UE8buJfxZzxW9uCHDTwm9-YGw1htqDBAfSDRq5gRkG2OLkWpxt43X80NqcJV3w",
      });

      if (token) {
        // ... (ส่วนบันทึกลงฐานข้อมูล โค้ดเดิม) ...
        await fetch("/api/save-fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        console.log("บันทึก Token เรียบร้อย");
      }
    } else {
      console.log("User denied notifications");
    }
  } catch (error) {
    console.error("Notification Error:", error);
  }
}
