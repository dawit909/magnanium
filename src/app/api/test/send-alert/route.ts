import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, createUnsubscribeToken } from "@/lib/subscriptions";
import { getPersonReleases } from "@/lib/tmdb";
import { sendReleaseAlertEmail } from "@/lib/email";
import { createPersonSlug } from "@/lib/slug";
import { FormattedRelease } from "@/types/tmdb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("mg_session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to test alerts." },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const user = await getUser(session.email);
    if (!user) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let personId: number | undefined = body.personId ? Number(body.personId) : undefined;
    let personName: string | undefined = body.personName ? String(body.personName) : undefined;

    // If no artist specified, pick user's first followed artist or default to Quentin Tarantino
    if (!personId) {
      const followedArtistIds = Object.keys(user.artists);
      if (followedArtistIds.length > 0) {
        const first = user.artists[followedArtistIds[0]];
        personId = first.personId;
        personName = first.personName;
      } else {
        personId = 138;
        personName = "Quentin Tarantino";
      }
    }

    // Resolve site URL
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "magnanium.vercel.app";
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const protocol =
      forwardedProto ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    // Fetch releases for this person
    const tmdbData = await getPersonReleases({
      personId,
      country: user.artists[String(personId)]?.country || "US",
      window: "all",
      roles: user.artists[String(personId)]?.roles || ["all"],
      types: user.artists[String(personId)]?.types || ["cinema", "home", "tv", "premiere"],
    });

    const resolvedName = personName || tmdbData.personName || "Artist";
    const slug = createPersonSlug(personId, resolvedName);
    const artistUrl = `${siteUrl}/${slug}`;
    const manageUrl = `${siteUrl}/feeds`;
    const unsubscribeToken = createUnsubscribeToken(session.email, personId);
    const unsubscribeUrl = `${siteUrl}/api/subscriptions/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    // Prepare realistic mock release items for the email
    let alertReleases: FormattedRelease[] = [];

    if (tmdbData.releases && tmdbData.releases.length > 0) {
      alertReleases = tmdbData.releases.slice(0, 2).map((rel, idx) => ({
        ...rel,
        // If release date is past or missing, set an upcoming date for a realistic upcoming release alert
        releaseDate:
          rel.releaseDate && rel.releaseDate >= new Date().toISOString().split("T")[0]
            ? rel.releaseDate
            : new Date(Date.now() + (idx === 0 ? 30 : 90) * 86400 * 1000).toISOString().split("T")[0],
      }));
    } else {
      alertReleases = [
        {
          id: `mock-release-1-${personId}`,
          movieId: 90001,
          movieTitle: `${resolvedName}'s Next Feature`,
          releaseDate: new Date(Date.now() + 35 * 86400 * 1000).toISOString().split("T")[0],
          releaseType: "cinema",
          releaseTypeLabel: "Theatrical (Cinema)",
          role: "Director, Writer",
          overview: `An upcoming feature film project directed and written by ${resolvedName}, scheduled for theatrical release in cinemas nationwide.`,
          posterPath: tmdbData.profilePath || null,
          mediaType: "movie",
          country: "US",
          tmdbUrl: `https://www.themoviedb.org/person/${personId}`,
        },
      ];
    }

    const emailResult = await sendReleaseAlertEmail({
      to: session.email,
      artistName: resolvedName,
      releases: alertReleases,
      artistUrl,
      manageUrl,
      unsubscribeUrl,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email alert." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test alert sent to ${session.email}`,
      simulated: emailResult.simulated,
      artistName: resolvedName,
    });
  } catch (err: any) {
    console.error("Test alert error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send test alert" },
      { status: 500 }
    );
  }
}
