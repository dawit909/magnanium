import { NextRequest, NextResponse } from "next/server";
import {
  subscribeArtist,
  unsubscribeArtist,
  updateArtistSubscription,
  getUser,
} from "@/lib/subscriptions";
import { authenticateRequest } from "@/lib/api-response";
import { normalizeTypes } from "@/lib/feed-options";
import { AlertTimingWindow } from "@/types/tmdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
};

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.session) {
    return auth.errorResponse!;
  }
  const session = auth.session;

  const body = await request.json().catch(() => null);
  if (!body || !body.action) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { action, personId } = body;
  if (!personId || typeof personId !== "number") {
    return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
  }

  let updatedUser = null;

  if (action === "subscribe") {
    const {
      personName,
      profilePath,
      alert,
      frequency,
      country,
      roles,
      types,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    } = body;
    const sanitizedTypes = Array.isArray(types) ? normalizeTypes(types) : undefined;
    updatedUser = await subscribeArtist(session.email, {
      personId,
      personName: String(personName || "Artist"),
      profilePath: profilePath ? String(profilePath) : null,
      alert: (alert as AlertTimingWindow) || "announced",
      frequency: ["instant", "weekly", "monthly"].includes(frequency) ? frequency : "instant",
      country: String(country || "US"),
      ...(Array.isArray(roles) ? { roles } : {}),
      ...(sanitizedTypes ? { types: sanitizedTypes } : {}),
      ...(typeof excludeShorts === "boolean" ? { excludeShorts } : {}),
      ...(typeof excludeReReleases === "boolean" ? { excludeReReleases } : {}),
      ...(typeof excludeUncredited === "boolean" ? { excludeUncredited } : {}),
    });
  } else if (action === "unsubscribe") {
    updatedUser = await unsubscribeArtist(session.email, personId);
  } else if (action === "update_options" || action === "update_alert") {
    const {
      alert,
      frequency,
      country,
      roles,
      types,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    } = body;
    const sanitizedTypes = Array.isArray(types) ? normalizeTypes(types) : undefined;
    updatedUser = await updateArtistSubscription(session.email, personId, {
      alert: alert as AlertTimingWindow,
      frequency: ["instant", "weekly", "monthly"].includes(frequency) ? frequency : undefined,
      country,
      roles,
      ...(sanitizedTypes !== undefined ? { types: sanitizedTypes } : {}),
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const user = updatedUser || (await getUser(session.email));

  return NextResponse.json(
    {
      success: true,
      user: {
        email: session.email,
        verified: true,
        artists: user?.artists || {},
      },
    },
    { headers: NO_CACHE_HEADERS }
  );
}
