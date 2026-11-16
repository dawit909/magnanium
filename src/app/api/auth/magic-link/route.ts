import { NextRequest, NextResponse } from "next/server";
import { createMagicToken, normalizeEmail } from "@/lib/subscriptions";
import { sendMagicLinkEmail } from "@/lib/email";
import { guardRateLimit, getRequestSiteUrl } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/constants";
import { normalizeTypes } from "@/lib/feed-options";
import { DigestFrequency } from "@/types/tmdb";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 magic link requests per minute per IP
    const rateGuard = guardRateLimit(request, "auth-magic-link", 10, 60 * 1000, true);
    if (!rateGuard.allowed) {
      return rateGuard.response!;
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.email || typeof body.email !== "string") {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    // Artist payload if subscribing directly from an artist page
    const artist = body.artist && typeof body.artist.personId === "number"
      ? {
          personId: Number(body.artist.personId),
          personName: String(body.artist.personName || "Artist"),
          profilePath: body.artist.profilePath ? String(body.artist.profilePath) : null,
          alert: body.artist.alert || "announced",
          frequency: ["instant", "weekly", "monthly"].includes(body.artist.frequency)
            ? (body.artist.frequency as DigestFrequency)
            : "instant",
          country: body.artist.country || "US",
          ...(Array.isArray(body.artist.roles) ? { roles: body.artist.roles } : {}),
          ...(Array.isArray(body.artist.types) ? { types: normalizeTypes(body.artist.types) } : {}),
          ...(typeof body.artist.excludeShorts === "boolean"
            ? { excludeShorts: body.artist.excludeShorts }
            : {}),
          ...(typeof body.artist.excludeReReleases === "boolean"
            ? { excludeReReleases: body.artist.excludeReReleases }
            : {}),
          ...(typeof body.artist.excludeUncredited === "boolean"
            ? { excludeUncredited: body.artist.excludeUncredited }
            : {}),
        }
      : undefined;

    const token = await createMagicToken(email, artist);
    const siteUrl = getRequestSiteUrl(request);
    const verifyUrl = `${siteUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

    const emailResult = await sendMagicLinkEmail({
      to: email,
      verifyUrl,
      artistName: artist?.personName,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send confirmation email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Confirmation link sent to your email",
      simulated: emailResult.simulated,
    });
  } catch (err: any) {
    console.error("Magic link route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
