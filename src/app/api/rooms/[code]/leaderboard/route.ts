import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_image: string | null;
  completed_count: number;
  completed_lines: number;
}

// Calculate completed Bingo lines
function calculateBingoLines(completedIndices: number[]): number {
  const indexSet = new Set(completedIndices);
  let lines = 0;

  // Check rows (5 rows)
  for (let row = 0; row < 5; row++) {
    let rowComplete = true;
    for (let col = 0; col < 5; col++) {
      if (!indexSet.has(row * 5 + col)) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) lines++;
  }

  // Check columns (5 columns)
  for (let col = 0; col < 5; col++) {
    let colComplete = true;
    for (let row = 0; row < 5; row++) {
      if (!indexSet.has(row * 5 + col)) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) lines++;
  }

  // Check diagonal (top-left to bottom-right)
  let diag1Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!indexSet.has(i * 5 + i)) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) lines++;

  // Check diagonal (top-right to bottom-left)
  let diag2Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!indexSet.has(i * 5 + (4 - i))) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) lines++;

  return lines;
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
        completed_lines: calculateBingoLines(indices),
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
