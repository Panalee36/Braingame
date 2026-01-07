import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // 1️⃣ รับข้อมูลจาก frontend
    const { username, password } = await req.json();

    // 2️⃣ ทำความสะอาด input
    const normalizedUsername =
      typeof username === "string" ? username.trim() : "";

    if (!normalizedUsername || !password) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // 3️⃣ เชื่อมต่อ MongoDB
    const client = await clientPromise;

    // ❗ ต้องระบุ database ให้ตรงกับ Compass
    const db = client.db("game_db");

    // ❗ ต้องใช้ collection ที่ถูกต้อง
    const usersCollection = db.collection("players");

    // 4️⃣ ค้นหาผู้ใช้ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
    const user = await usersCollection.findOne({
      username: {
        $regex: new RegExp(`^${normalizedUsername}$`, "i"),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ไม่พบผู้ใช้" },
        { status: 404 }
      );
    }

    // 5️⃣ ตรวจสอบรหัสผ่าน (bcrypt)
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // 6️⃣ Login สำเร็จ
    const anonId = `anon_${user._id.toHexString()}`;

    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user._id.toHexString(),
        username: user.username,
        age: user.age,
        anonId,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
