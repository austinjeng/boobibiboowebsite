import { getTestPool } from "../setup-db";

export async function seedTestUser(
  id: string = "test-user-1",
  overrides: { name?: string; email?: string } = {}
) {
  const pool = getTestPool();
  const name = overrides.name || "Test User";
  const email = overrides.email || `${id}@test.com`;
  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified")
     VALUES ($1, $2, $3, true)
     ON CONFLICT (id) DO NOTHING`,
    [id, name, email]
  );
  return { id, name, email };
}

export async function seedPlace(overrides: {
  id?: string;
  name?: string;
  lat?: number;
  lng?: number;
  externalPlaceId?: string;
} = {}) {
  const pool = getTestPool();
  const result = await pool.query(
    `INSERT INTO place (${overrides.id ? "id, " : ""}name, lat, lng, external_place_id)
     VALUES (${overrides.id ? "$1, $2, $3, $4, $5" : "$1, $2, $3, $4"})
     RETURNING *`,
    overrides.id
      ? [overrides.id, overrides.name || "Test Place", overrides.lat ?? 25.033, overrides.lng ?? 121.565, overrides.externalPlaceId || null]
      : [overrides.name || "Test Place", overrides.lat ?? 25.033, overrides.lng ?? 121.565, overrides.externalPlaceId || null]
  );
  return result.rows[0];
}

export async function seedBingoCard(overrides: {
  id?: string;
  theme?: string;
  weekStartDate?: string;
} = {}) {
  const pool = getTestPool();
  const theme = overrides.theme || "Test Theme";
  const weekStartDate = overrides.weekStartDate || "2025-01-06";
  const result = await pool.query(
    overrides.id
      ? `INSERT INTO bingo_card (id, theme, week_start_date) VALUES ($1, $2, $3) RETURNING *`
      : `INSERT INTO bingo_card (theme, week_start_date) VALUES ($1, $2) RETURNING *`,
    overrides.id
      ? [overrides.id, theme, weekStartDate]
      : [theme, weekStartDate]
  );
  return result.rows[0];
}

export async function seedBingoTasks(bingoCardId: string, count: number = 25) {
  const pool = getTestPool();
  const tasks = [];
  for (let i = 0; i < count; i++) {
    const result = await pool.query(
      `INSERT INTO bingo_task (bingo_card_id, task_index, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [bingoCardId, i, `Task ${i}`]
    );
    tasks.push(result.rows[0]);
  }
  return tasks;
}

export async function seedCheckIn(
  userId: string,
  placeId: string,
  overrides: {
    note?: string;
    photoUrl?: string;
    happyTags?: string[];
    cautions?: string[];
    contexts?: string[];
  } = {}
) {
  const pool = getTestPool();
  const result = await pool.query(
    `INSERT INTO check_in (user_id, place_id, note, photo_url, happy_tags, cautions, contexts)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      placeId,
      overrides.note || "Test note",
      overrides.photoUrl || null,
      overrides.happyTags || ["vibe_good"],
      overrides.cautions || [],
      overrides.contexts || [],
    ]
  );
  return result.rows[0];
}

export async function seedRoom(
  bingoCardId: string,
  createdBy: string,
  code: string = "TEST01"
) {
  const pool = getTestPool();
  const result = await pool.query(
    `INSERT INTO room (code, bingo_card_id, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [code, bingoCardId, createdBy]
  );
  // Add creator as member
  await pool.query(
    `INSERT INTO room_member (room_id, user_id) VALUES ($1, $2)`,
    [result.rows[0].id, createdBy]
  );
  return result.rows[0];
}

export async function seedBingoCompletion(
  userId: string,
  taskId: string,
  checkInId: string
) {
  const pool = getTestPool();
  const result = await pool.query(
    `INSERT INTO bingo_completion (user_id, bingo_task_id, check_in_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, taskId, checkInId]
  );
  return result.rows[0];
}
