import { NextResponse } from "next/server";
import admin from "firebase-admin";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    // 1. ตั้งค่า Firebase Admin (เช็คการ Initialize)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    // 2. เชื่อมต่อฐานข้อมูล MongoDB
    const client = await clientPromise;
    const db = client.db("game_db");

    // 3. ค้นหาผู้เล่นที่มี Token พร้อมส่ง
    const players = await db
      .collection("players")
      .find({ fcmToken: { $exists: true, $ne: null } })
      .toArray();

    if (players.length === 0) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้ที่มี Token ในระบบ" });
    }

    // กรอง Token ที่ไม่ซ้ำกัน
    const tokens = [...new Set(players.map((p) => p.fcmToken))];

    // 4. ตั้งค่าข้อความแจ้งเตือนสำหรับผู้สูงอายุ
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: "☀️ สวัสดีตอนเช้าครับ!",
        body: "ได้เวลามาบริหารสมองกันแล้ว วันนี้มีเกมสนุกๆ รออยู่นะครับ 🎮",
      },
      tokens: tokens,
    };

    // 5. ส่งแจ้งเตือนแบบกลุ่ม (Multicast)
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `✅ ส่งสำเร็จ: ${response.successCount}, ❌ ล้มเหลว: ${response.failureCount}`,
    );

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    });
  } catch (error: any) {
    console.error("❌ Cron Job Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 },
    );
  }
}
