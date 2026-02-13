import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { date, games, currentStep, history, streak, cycleStartDate } = body;

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("daily_progress");

    await collection.updateOne(
      { userId: session.userId },
      {
        $set: {
          userId: session.userId,
          date,
          games,
          currentStep,
          history,
          streak,
          cycleStartDate,
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
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    const collection = db.collection("daily_progress");
    const data = await collection.findOne({ userId: session.userId });

    if (data) {
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, message: "Not found" });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
