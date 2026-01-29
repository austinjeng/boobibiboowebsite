import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireUserId } from "@/lib/get-session";

interface CompleteRequest {
  taskId: string;
  checkInId: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body: CompleteRequest = await request.json();

    const { taskId, checkInId } = body;

    if (!taskId || !checkInId) {
      return NextResponse.json(
        { error: "taskId and checkInId are required" },
        { status: 400 }
      );
    }

    // Verify the task exists
    const task = await queryOne<{ id: string }>(
      "SELECT id FROM bingo_task WHERE id = $1",
      [taskId]
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify the check-in exists and belongs to the user
    const checkIn = await queryOne<{ id: string }>(
      "SELECT id FROM check_in WHERE id = $1 AND user_id = $2",
      [checkInId, userId]
    );

    if (!checkIn) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }

    // Check if already completed
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM bingo_completion WHERE user_id = $1 AND bingo_task_id = $2",
      [userId, taskId]
    );

    if (existing) {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 409 }
      );
    }

    // Create completion record
    const result = await query<{ id: string; completed_at: string }>(
      `INSERT INTO bingo_completion (user_id, bingo_task_id, check_in_id)
       VALUES ($1, $2, $3)
       RETURNING id, completed_at`,
      [userId, taskId, checkInId]
    );

    return NextResponse.json({
      success: true,
      completion: result[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error completing bingo task:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    );
  }
}
