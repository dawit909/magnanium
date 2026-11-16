import { NextRequest, NextResponse } from "next/server";
import {
  verifyAndConsumeMagicToken,
  subscribeArtist,
  createSession,
} from "@/lib/subscriptions";
import { createPersonSlug } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "magnanium.vercel.app";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/?auth_error=invalid_token`);
  }

  const payload = await verifyAndConsumeMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(`${siteUrl}/?auth_error=expired_token`);
  }

  // If this magic link was initiated for an artist, subscribe them immediately
  let redirectPath = "/?auth_success=true";
  if (payload.artist) {
    await subscribeArtist(payload.email, payload.artist);
    const slug = createPersonSlug(payload.artist.personId, payload.artist.personName);
    redirectPath = `/${slug}?alert_subscribed=true`;
  }

  // Create persistent session
  const sessionToken = await createSession(payload.email);

  const response = NextResponse.redirect(`${siteUrl}${redirectPath}`);

  // Set 30-day session cookie
  response.cookies.set("mg_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
