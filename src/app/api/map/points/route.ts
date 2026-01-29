import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/get-session";

interface MapPoint {
  place_id: string;
  place_name: string;
  lat: number;
  lng: number;
  check_in_count: number;
  happy_tags: string[];
  latest_note: string | null;
  latest_photo_url: string | null;
  cautions: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const happyTag = searchParams.get("happyTag");
    const contextTag = searchParams.get("context");
    const searchQuery = searchParams.get("q");

    // Build query conditions
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Only show user's own check-ins if logged in
    if (session?.user?.id) {
      conditions.push(`c.user_id = $${paramIndex++}`);
      params.push(session.user.id);
    }

    if (happyTag) {
      conditions.push(`$${paramIndex++} = ANY(c.happy_tags)`);
      params.push(happyTag);
    }

    if (contextTag) {
      conditions.push(`$${paramIndex++} = ANY(c.contexts)`);
      params.push(contextTag);
    }

    if (searchQuery) {
      conditions.push(`p.name ILIKE $${paramIndex++}`);
      params.push(`%${searchQuery}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Aggregate check-ins by place
    const points = await query<MapPoint>(
      `SELECT
        p.id as place_id,
        p.name as place_name,
        p.lat,
        p.lng,
        COUNT(c.id)::int as check_in_count,
        array_agg(DISTINCT unnest_tags) FILTER (WHERE unnest_tags IS NOT NULL) as happy_tags,
        (array_agg(c.note ORDER BY c.created_at DESC))[1] as latest_note,
        (array_agg(c.photo_url ORDER BY c.created_at DESC))[1] as latest_photo_url,
        array_agg(DISTINCT unnest_cautions) FILTER (WHERE unnest_cautions IS NOT NULL) as cautions
       FROM check_in c
       JOIN place p ON c.place_id = p.id
       LEFT JOIN LATERAL unnest(c.happy_tags) as unnest_tags ON true
       LEFT JOIN LATERAL unnest(c.cautions) as unnest_cautions ON true
       ${whereClause}
       GROUP BY p.id, p.name, p.lat, p.lng
       ORDER BY check_in_count DESC
       LIMIT 100`,
      params
    );

    return NextResponse.json({ points });
  } catch (error) {
    console.error("Error fetching map points:", error);
    return NextResponse.json(
      { error: "Failed to fetch map points" },
      { status: 500 }
    );
  }
}
