import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  subscribeArtist,
  unsubscribeArtist,
  updateArtistSubscription,
  getUser,
} from "@/lib/subscriptions";
import { AlertTimingWindow } from "@/types/tmdb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("mg_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

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
      country,
      roles,
      types,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    } = body;
    const sanitizedTypes = Array.isArray(types)
      ? types.includes("earliest") && types.length > 1
        ? ["earliest"]
        : types
      : undefined;
    updatedUser = await subscribeArtist(session.email, {
      personId,
      personName: String(personName || "Artist"),
      profilePath: profilePath ? String(profilePath) : null,
      alert: (alert as AlertTimingWindow) || "announced",
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
      country,
      roles,
      types,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    } = body;
    const sanitizedTypes = Array.isArray(types)
      ? types.includes("earliest") && types.length > 1
        ? ["earliest"]
        : types
      : undefined;
    updatedUser = await updateArtistSubscription(session.email, personId, {
      alert: alert as AlertTimingWindow,
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

  return NextResponse.json({
    success: true,
    user: {
      email: session.email,
      verified: true,
      artists: user?.artists || {},
    },
  });
}
