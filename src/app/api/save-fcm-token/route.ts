import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { token } = await req.json();
    if (typeof token !== "string" || token.length < 20) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("game_db");
    await db.collection("players").updateOne(
      { _id: new ObjectId(session.userId) },
      { $set: { fcmToken: token } },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save FCM token error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
