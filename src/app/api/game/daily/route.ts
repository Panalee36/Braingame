// src/app/api/game/daily/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      date,
      games,
      currentStep,
      history,
      streak,
      cycleStartDate,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "No UserId" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("daily_progress");

    // อัปเดตข้อมูล (ถ้ามีอยู่แล้วให้ทับ ถ้าไม่มีให้สร้างใหม่)
    await collection.updateOne(
      { userId: userId },
      {
        $set: {
          userId,
          date, // วันที่ของภารกิจปัจจุบัน
          games, // รายชื่อเกมที่สุ่มได้วันนี้ (จะได้เหมือนกันทุกเครื่อง)
          currentStep, // เล่นถึงด่านไหนแล้ว
          history, // ประวัติวันที่ทำสำเร็จ
          streak, // จำนวนวันต่อเนื่อง
          cycleStartDate, // วันเริ่มรอบ 7 วัน
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("daily_progress");

    const data = await collection.findOne({ userId: userId });

    if (data) {
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, message: "Not found" }); // ยังไม่เคยเล่น
    }
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
