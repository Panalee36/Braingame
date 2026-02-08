import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// 1. บันทึกคะแนน (POST)
export async function POST(req: Request) {
  try {
    const { userId, gameType, score, timeUsed } = await req.json();

    if (!userId || !gameType || score === undefined) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("game_history");

    const insertData: any = {
      userId,
      gameType,
      score: Number(score),
      createdAt: new Date(),
    };

    // เพิ่ม timeUsed ถ้ามีการส่งมา (สำหรับเกมจำศัพท์)
    if (timeUsed !== undefined) {
      insertData.timeUsed = Number(timeUsed);
    }

    await collection.insertOne(insertData);

    return NextResponse.json({ success: true, message: "บันทึกคะแนนสำเร็จ" });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 },
    );
  }
}

// 2. ดึงประวัติการเล่น (GET)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ระบุ UserId" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("game_history");

    // ดึงข้อมูลเฉพาะของ userId นี้ และเรียงจากล่าสุดไปเก่าสุด
    const history = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 },
    );
  }
}
