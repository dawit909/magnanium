import { NextRequest, NextResponse } from "next/server";
import { searchPerson } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { results, noApiKey } = await searchPerson(query, clientKey);
    return NextResponse.json({ results, noApiKey: !!noApiKey });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search people", results: [] },
      { status: 500 }
    );
  }
}
