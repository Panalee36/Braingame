import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const normalizedUsername = typeof username === "string" ? username.trim() : "";
    const normalizedLower = normalizedUsername.toLowerCase();

    if (!normalizedUsername || !password) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const usersCollection = db.collection("players");

    const escapedUsername = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const user = await usersCollection.findOne({
      $or: [
        { usernameLower: normalizedLower },
        { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } },
      ],
    });

    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    if (!user.usernameLower) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { usernameLower: String(user.username).toLowerCase() } },
      );
    }

    const anonId = `anon_${user._id.toHexString()}`;
    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user._id.toHexString(),
        username: user.username,
        age: user.age,
        createdAt: user.createdAt,
        anonId,
      },
    });

    const sessionToken = createSessionToken(user._id.toHexString(), String(user.username));
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 },
    );
  }
}
