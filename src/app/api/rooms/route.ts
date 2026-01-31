import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireUserId, getUserId } from "@/lib/get-session";
import { generateRoomCode } from "@/lib/room-code";

// Get current user's rooms
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ rooms: [] });
    }

    const rooms = await query<{ id: string; code: string; theme: string }>(
      `SELECT r.id, r.code, bc.theme
       FROM room r
       JOIN room_member rm ON r.id = rm.room_id
       JOIN bingo_card bc ON r.bingo_card_id = bc.id
       WHERE rm.user_id = $1
       ORDER BY rm.joined_at DESC`,
      [userId]
    );

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

interface CreateRoomRequest {
  bingoCardId: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body: CreateRoomRequest = await request.json();

    const { bingoCardId } = body;

    if (!bingoCardId) {
      return NextResponse.json(
        { error: "bingoCardId is required" },
        { status: 400 }
      );
    }

    // Verify bingo card exists
    const card = await queryOne<{ id: string }>(
      "SELECT id FROM bingo_card WHERE id = $1",
      [bingoCardId]
    );

    if (!card) {
      return NextResponse.json(
        { error: "Bingo card not found" },
        { status: 404 }
      );
    }

    // Generate unique room code
    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      const existing = await queryOne<{ id: string }>(
        "SELECT id FROM room WHERE code = $1",
        [code]
      );
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique room code" },
        { status: 500 }
      );
    }

    // Create room
    const result = await query<{
      id: string;
      code: string;
      created_at: string;
    }>(
      `INSERT INTO room (code, bingo_card_id, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, code, created_at`,
      [code, bingoCardId, userId]
    );

    // Add creator as a member
    await query(
      `INSERT INTO room_member (room_id, user_id)
       VALUES ($1, $2)`,
      [result[0].id, userId]
    );

    return NextResponse.json({ room: result[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
