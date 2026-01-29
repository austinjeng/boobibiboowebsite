import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireUserId } from "@/lib/get-session";

interface JoinRoomRequest {
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body: JoinRoomRequest = await request.json();

    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    // Find room by code (case-insensitive)
    const room = await queryOne<{ id: string; code: string }>(
      "SELECT id, code FROM room WHERE UPPER(code) = UPPER($1)",
      [code]
    );

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if already a member
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM room_member WHERE room_id = $1 AND user_id = $2",
      [room.id, userId]
    );

    if (existing) {
      return NextResponse.json({
        success: true,
        room,
        message: "Already a member",
      });
    }

    // Add user as member
    await query(
      `INSERT INTO room_member (room_id, user_id)
       VALUES ($1, $2)`,
      [room.id, userId]
    );

    return NextResponse.json({ success: true, room });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
