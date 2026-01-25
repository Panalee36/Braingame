// src/app/api/game/history/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { userId, gameType, score } = await req.json();
    if (!userId || !gameType || score === undefined) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 },
      );
    }
    const client = await clientPromise;
    const db = client.db("game_db");
    await db.collection("game_history").insertOne({
      userId,
      gameType,
      score: Number(score),
      createdAt: new Date(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ success: false }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("game_db");
    const history = await db
      .collection("game_history")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
