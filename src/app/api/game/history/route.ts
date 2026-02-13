import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";

const ALLOWED_GAME_TYPES = new Set([
  "color-matching",
  "fast-math",
  "sequential-memory",
  "animal-sound",
  "vocabulary",
  "daily-quiz-bonus",
]);

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { gameType, score, timeUsed } = await req.json();
    if (!ALLOWED_GAME_TYPES.has(String(gameType))) {
      return NextResponse.json(
        { success: false, message: "Invalid game type" },
        { status: 400 },
      );
    }

    const parsedScore = Number(score);
    if (!Number.isFinite(parsedScore)) {
      return NextResponse.json(
        { success: false, message: "Invalid score" },
        { status: 400 },
      );
    }

    const insertData: {
      userId: string;
      gameType: string;
      score: number;
      createdAt: Date;
      timeUsed?: number;
    } = {
      userId: session.userId,
      gameType: String(gameType),
      score: parsedScore,
      createdAt: new Date(),
    };

    if (timeUsed !== undefined) {
      const parsedTimeUsed = Number(timeUsed);
      if (Number.isFinite(parsedTimeUsed)) {
        insertData.timeUsed = parsedTimeUsed;
      }
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("game_history");
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

export async function GET(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("game_history");
    const history = await collection
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000)
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
