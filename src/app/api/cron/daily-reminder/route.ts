import { NextResponse } from "next/server";
import admin from "firebase-admin";
import clientPromise from "@/lib/mongodb";

function isAuthorizedCronRequest(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cronSecretHeader = req.headers.get("x-cron-secret");
  if (cronSecretHeader === secret) return true;

  return false;
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const client = await clientPromise;
    const db = client.db("game_db");

    const players = await db
      .collection("players")
      .find({ fcmToken: { $exists: true, $ne: null } })
      .toArray();

    if (players.length === 0) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้ที่มี Token ในระบบ" });
    }

    const tokens = [...new Set(players.map((p) => p.fcmToken).filter(Boolean))];
    if (tokens.length === 0) {
      return NextResponse.json({ message: "ไม่พบ Token ที่ใช้งานได้" });
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: "สวัสดีตอนเช้าครับ!",
        body: "ได้เวลามาบริหารสมองกันแล้ว วันนี้มีเกมสนุกๆ รออยู่นะครับ",
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`ส่งสำเร็จ: ${response.successCount}, ล้มเหลว: ${response.failureCount}`);

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 },
    );
  }
}
