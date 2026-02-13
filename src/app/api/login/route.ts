import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const normalizedUsername = typeof username === "string" ? username.trim() : "";
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedLower = normalizedUsername.toLowerCase();

    if (!normalizedUsername || !normalizedPassword) {
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

    const storedPasswordHash = typeof user?.password === "string" ? user.password : "";
    const passwordMatches =
      user && storedPasswordHash ? await bcrypt.compare(normalizedPassword, storedPasswordHash) : false;

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    const userId =
      user._id && typeof user._id === "object" && typeof user._id.toHexString === "function"
        ? user._id.toHexString()
        : String(user._id);
    const usernameForSession = String(user.username ?? normalizedUsername);

    if (!user.usernameLower) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { usernameLower: String(user.username).toLowerCase() } },
      );
    }

    const anonId = `anon_${userId}`;
    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: userId,
        username: user.username,
        age: user.age,
        createdAt: user.createdAt,
        anonId,
      },
    });

    const sessionToken = createSessionToken(userId, usernameForSession);
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
