// src/app/api/save-fcm-token/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { userId, token } = await req.json();
    const client = await clientPromise;

    // ✅ ต้องเป็น game_db (เหมือนไฟล์ cron)
    const db = client.db("game_db");

    // ✅ ต้องเป็น players (เหมือนไฟล์ cron)
    // และต้องแปลง userId เป็น ObjectId
    await db
      .collection("players")
      .updateOne({ _id: new ObjectId(userId) }, { $set: { fcmToken: token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
