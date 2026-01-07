// Health check endpoint (GET)
export async function GET() {
  return NextResponse.json({ message: "API Register พร้อมใช้งาน" });
}
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, age } = body;

    if (!username || !password || !age) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const users = db.collection("players");

    const existing = await users.findOne({ username });
    if (existing) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await users.insertOne({
      username,
      password: hashed,
      age: Number(age),
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ!" });
  } catch (error: any) {
    // ตรวจสอบว่า error มี message หรือไม่
    const errMsg = error?.message || "เกิดข้อผิดพลาด";
    return NextResponse.json(
      { message: errMsg },
      { status: 500 }
    );
  }
}
