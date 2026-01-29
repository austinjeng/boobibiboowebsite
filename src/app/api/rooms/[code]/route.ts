import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

interface RoomInfo {
  id: string;
  code: string;
  bingo_card_id: string;
  created_by: string;
  created_at: string;
  theme: string;
}

interface RoomMember {
  user_id: string;
  user_name: string;
  user_image: string | null;
  joined_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Get room info
    const room = await queryOne<RoomInfo>(
      `SELECT r.*, bc.theme
       FROM room r
       JOIN bingo_card bc ON r.bingo_card_id = bc.id
       WHERE UPPER(r.code) = UPPER($1)`,
      [code]
    );

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get room members
    const members = await query<RoomMember>(
      `SELECT rm.user_id, u.name as user_name, u.image as user_image, rm.joined_at
       FROM room_member rm
       JOIN "user" u ON rm.user_id = u.id
       WHERE rm.room_id = $1
       ORDER BY rm.joined_at`,
      [room.id]
    );

    return NextResponse.json({ room, members });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}
