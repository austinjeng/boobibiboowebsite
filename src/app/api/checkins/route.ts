import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, requireUserId } from "@/lib/get-session";
import {
  isValidHappyTag,
  isValidCautionTag,
  isValidContextTag,
  type HappyTag,
  type CautionTag,
  type ContextTag,
} from "@/lib/tags";

interface CreateCheckInRequest {
  placeId: string;
  note?: string;
  photoUrl?: string;
  happyTags: HappyTag[];
  cautions?: CautionTag[];
  contexts?: ContextTag[];
}

interface CheckIn {
  id: string;
  user_id: string;
  place_id: string;
  note: string | null;
  photo_url: string | null;
  happy_tags: string[];
  cautions: string[];
  contexts: string[];
  created_at: string;
  place_name: string;
  place_lat: number;
  place_lng: number;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body: CreateCheckInRequest = await request.json();

    const { placeId, note, photoUrl, happyTags, cautions, contexts } = body;

    // Validation
    if (!placeId) {
      return NextResponse.json(
        { error: "placeId is required" },
        { status: 400 }
      );
    }

    if (!note && !photoUrl) {
      return NextResponse.json(
        { error: "Either note or photoUrl is required" },
        { status: 400 }
      );
    }

    if (!happyTags || happyTags.length === 0) {
      return NextResponse.json(
        { error: "At least one happy tag is required" },
        { status: 400 }
      );
    }

    // Validate tags
    if (!happyTags.every(isValidHappyTag)) {
      return NextResponse.json(
        { error: "Invalid happy tag" },
        { status: 400 }
      );
    }

    if (cautions && !cautions.every(isValidCautionTag)) {
      return NextResponse.json(
        { error: "Invalid caution tag" },
        { status: 400 }
      );
    }

    if (contexts && !contexts.every(isValidContextTag)) {
      return NextResponse.json(
        { error: "Invalid context tag" },
        { status: 400 }
      );
    }

    // Create check-in
    const result = await query<{ id: string; created_at: string }>(
      `INSERT INTO check_in (user_id, place_id, note, photo_url, happy_tags, cautions, contexts)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        userId,
        placeId,
        note || null,
        photoUrl || null,
        happyTags,
        cautions || [],
        contexts || [],
      ]
    );

    return NextResponse.json({ checkIn: result[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating check-in:", error);
    return NextResponse.json(
      { error: "Failed to create check-in" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const happyTag = searchParams.get("happyTag");
    const contextTag = searchParams.get("context");
    const placeId = searchParams.get("placeId");
    const userId = searchParams.get("userId") || session?.user?.id;

    // Build query conditions
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`c.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (happyTag) {
      conditions.push(`$${paramIndex++} = ANY(c.happy_tags)`);
      params.push(happyTag);
    }

    if (contextTag) {
      conditions.push(`$${paramIndex++} = ANY(c.contexts)`);
      params.push(contextTag);
    }

    if (placeId) {
      conditions.push(`c.place_id = $${paramIndex++}`);
      params.push(placeId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const checkIns = await query<CheckIn>(
      `SELECT c.*, p.name as place_name, p.lat as place_lat, p.lng as place_lng
       FROM check_in c
       JOIN place p ON c.place_id = p.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT 50`,
      params
    );

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 }
    );
  }
}
