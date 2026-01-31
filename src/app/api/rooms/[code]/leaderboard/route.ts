import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { calculateBingoLines } from "@/lib/bingo";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_image: string | null;
  completed_count: number;
  completed_lines: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Get room and bingo card
    const room = await queryOne<{ id: string; bingo_card_id: string }>(
      "SELECT id, bingo_card_id FROM room WHERE UPPER(code) = UPPER($1)",
      [code]
    );

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get all members with their completion data
    const memberData = await query<{
      user_id: string;
      user_name: string;
      user_image: string | null;
      task_indices: number[] | null;
    }>(
      `SELECT
        rm.user_id,
        u.name as user_name,
        u.image as user_image,
        array_agg(bt.task_index) FILTER (WHERE bt.task_index IS NOT NULL) as task_indices
       FROM room_member rm
       JOIN "user" u ON rm.user_id = u.id
       LEFT JOIN bingo_completion bc ON bc.user_id = rm.user_id
       LEFT JOIN bingo_task bt ON bc.bingo_task_id = bt.id AND bt.bingo_card_id = $2
       WHERE rm.room_id = $1
       GROUP BY rm.user_id, u.name, u.image
       ORDER BY COUNT(bc.id) DESC`,
      [room.id, room.bingo_card_id]
    );

    // Calculate stats for each member
    const leaderboard: LeaderboardEntry[] = memberData.map((member) => {
      const indices = member.task_indices || [];
      return {
        user_id: member.user_id,
        user_name: member.user_name,
        user_image: member.user_image,
        completed_count: indices.length,
        completed_lines: calculateBingoLines(indices).lines,
      };
    });

    // Sort by lines first, then by completed count
    leaderboard.sort((a, b) => {
      if (b.completed_lines !== a.completed_lines) {
        return b.completed_lines - a.completed_lines;
      }
      return b.completed_count - a.completed_count;
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
