import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/get-session";

interface CreatePlaceRequest {
  name: string;
  lat: number;
  lng: number;
  externalPlaceId?: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireUserId();
    const body: CreatePlaceRequest = await request.json();

    const { name, lat, lng, externalPlaceId } = body;

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "name, lat, and lng are required" },
        { status: 400 }
      );
    }

    // Check if place with same external ID already exists
    if (externalPlaceId) {
      const existing = await query<{ id: string }>(
        "SELECT id FROM place WHERE external_place_id = $1",
        [externalPlaceId]
      );
      if (existing.length > 0) {
        return NextResponse.json({ place: existing[0] });
      }
    }

    // Create new place
    const result = await query<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      external_place_id: string | null;
      created_at: string;
    }>(
      `INSERT INTO place (name, lat, lng, external_place_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, lat, lng, externalPlaceId || null]
    );

    return NextResponse.json({ place: result[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating place:", error);
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}
