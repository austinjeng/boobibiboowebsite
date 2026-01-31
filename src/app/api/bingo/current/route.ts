import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { calculateBingoLines } from "@/lib/bingo";

interface BingoCard {
  id: string;
  theme: string;
  week_start_date: string;
}

interface BingoTask {
  id: string;
  bingo_card_id: string;
  task_index: number;
  title: string;
  rule: string | null;
}

interface BingoCompletion {
  bingo_task_id: string;
  check_in_id: string;
  completed_at: string;
}

export async function GET() {
  try {
    const session = await getSession();

    // Get current week's start date (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toISOString().split("T")[0];

    // Get current week's bingo card
    const card = await queryOne<BingoCard>(
      "SELECT * FROM bingo_card WHERE week_start_date = $1",
      [weekStartDate]
    );

    // If no card exists for this week, return empty state
    if (!card) {
      return NextResponse.json({
        card: null,
        tasks: [],
        completions: [],
        completedCount: 0,
        completedLines: 0,
      });
    }

    // Get all tasks for this card
    const tasks = await query<BingoTask>(
      "SELECT * FROM bingo_task WHERE bingo_card_id = $1 ORDER BY task_index",
      [card.id]
    );

    // Get user's completions if logged in
    let completions: BingoCompletion[] = [];
    let completedCount = 0;
    let completedLines = 0;

    if (session?.user?.id) {
      completions = await query<BingoCompletion>(
        `SELECT bc.bingo_task_id, bc.check_in_id, bc.completed_at
         FROM bingo_completion bc
         JOIN bingo_task bt ON bc.bingo_task_id = bt.id
         WHERE bc.user_id = $1 AND bt.bingo_card_id = $2`,
        [session.user.id, card.id]
      );

      // Calculate stats
      const completedTaskIds = new Set(completions.map((c) => c.bingo_task_id));
      completedCount = completedTaskIds.size;

      // Get indices of completed tasks
      const completedIndices = new Set(
        tasks
          .filter((t) => completedTaskIds.has(t.id))
          .map((t) => t.task_index)
      );
      completedLines = calculateBingoLines(completedIndices).lines;
    }

    return NextResponse.json({
      card,
      tasks,
      completions,
      completedCount,
      completedLines,
    });
  } catch (error) {
    console.error("Error fetching bingo card:", error);
    return NextResponse.json(
      { error: "Failed to fetch bingo card" },
      { status: 500 }
    );
  }
}
