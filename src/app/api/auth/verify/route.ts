import { NextRequest, NextResponse } from "next/server";
import {
  verifyAndConsumeMagicToken,
  subscribeArtist,
  createSession,
} from "@/lib/subscriptions";
import { createPersonSlug } from "@/lib/slug";
import { AUTH_CONFIG } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?auth_error=invalid_token", request.url));
  }

  const payload = await verifyAndConsumeMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/?auth_error=expired_token", request.url));
  }

  // If this verification was initiated for an artist, subscribe them immediately
  let redirectPath = "/?auth_success=true";
  if (payload.artist) {
    await subscribeArtist(payload.email, payload.artist);
    const slug = createPersonSlug(payload.artist.personId, payload.artist.personName);
    redirectPath = `/${slug}?alert_subscribed=true`;
  }

  // Create persistent session
  const sessionToken = await createSession(payload.email);

  const redirectUrl = new URL(redirectPath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const isSecure =
    request.nextUrl.protocol === "https:" ||
    (process.env.NODE_ENV === "production" &&
      !request.nextUrl.hostname.includes("localhost") &&
      !request.nextUrl.hostname.includes("127.0.0.1"));

  // Set 30-day session cookie
  response.cookies.set(AUTH_CONFIG.COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_CONFIG.SESSION_TTL_SECONDS,
  });

  return response;
}
