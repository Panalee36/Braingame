import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  return NextResponse.json({ message: "API Register พร้อมใช้งาน" });
}

export async function POST(req: Request) {
  try {
    const { username, password, age } = await req.json();

    const normalizedUsername = typeof username === "string" ? username.trim() : "";
    const normalizedLower = normalizedUsername.toLowerCase();
    const parsedAge = Number(age);

    if (!normalizedUsername || !password || !Number.isFinite(parsedAge)) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 },
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const users = db.collection("players");

    const escapedUsername = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await users.findOne({
      $or: [
        { usernameLower: normalizedLower },
        { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const createdAt = new Date();
    const insertResult = await users.insertOne({
      username: normalizedUsername,
      usernameLower: normalizedLower,
      password: hashed,
      age: parsedAge,
      createdAt,
    });

    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ!",
      user: {
        id: insertResult.insertedId.toHexString(),
        username: normalizedUsername,
        age: parsedAge,
        createdAt,
        anonId: `anon_${insertResult.insertedId.toHexString()}`,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 },
    );
  }
}
