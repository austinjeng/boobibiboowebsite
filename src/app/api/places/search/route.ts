import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  external_place_id: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ places: [] });
    }

    // Search places by name (case-insensitive)
    const places = await query<Place>(
      `SELECT id, name, lat, lng, external_place_id
       FROM place
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 20`,
      [`%${q}%`]
    );

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Error searching places:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
