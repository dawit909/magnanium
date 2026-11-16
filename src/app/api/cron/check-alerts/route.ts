import { NextRequest, NextResponse } from "next/server";
import {
  getAllSubscribedArtistIds,
  getArtistSubscribers,
  getUser,
  createUnsubscribeToken,
  SUB_KEYS,
} from "@/lib/subscriptions";
import { getPersonReleases } from "@/lib/tmdb";
import { sendReleaseAlertEmail } from "@/lib/email";
import { getDateWindowBoundaries } from "@/lib/feed-filter";
import { kv } from "@/lib/kv";
import { createPersonSlug } from "@/lib/slug";
import { FormattedRelease } from "@/types/tmdb";

export const runtime = "nodejs";
export const maxDuration = 60; // 60s timeout for cron on Vercel

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Validate CRON_SECRET if configured
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "magnanium.vercel.app";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

  try {
    const artistIds = await getAllSubscribedArtistIds();
    const boundaries = getDateWindowBoundaries();
    const { nowStr, sevenDaysFromNowStr, thirtyDaysFromNowStr } = boundaries;

    let emailsSent = 0;
    let releasesNotified = 0;

    for (const personId of artistIds) {
      const subscriberEmails = await getArtistSubscribers(personId);
      if (!subscriberEmails || subscriberEmails.length === 0) {
        continue;
      }

      // Fetch upcoming releases for this artist
      const { personName, releases } = await getPersonReleases({
        personId,
        window: "all",
      });

      if (!releases || releases.length === 0) {
        continue;
      }

      const slug = createPersonSlug(personId, personName);
      const artistUrl = `${siteUrl}/${slug}`;
      const manageUrl = `${siteUrl}/`;

      // Group per subscriber
      for (const email of subscriberEmails) {
        const user = await getUser(email);
        if (!user || !user.artists[String(personId)]) {
          continue;
        }

        const subInfo = user.artists[String(personId)];
        const alertTiming = subInfo.alert || "announced";

        // Filter releases matching the subscriber's timing window
        const matchingReleases: FormattedRelease[] = [];

        for (const rel of releases) {
          const d = rel.releaseDate;
          if (!d) continue;

          let matchesTiming = false;

          if (alertTiming === "when_released") {
            // Released within the past 48 hours or today
            matchesTiming = d <= nowStr && d >= boundaries.oneYearAgoStr;
          } else if (alertTiming === "week_before") {
            // Releasing within next 7 days
            matchesTiming = d > nowStr && d <= sevenDaysFromNowStr;
          } else if (alertTiming === "month_before") {
            // Releasing within next 30 days
            matchesTiming = d > nowStr && d <= thirtyDaysFromNowStr;
          } else {
            // "announced": all upcoming releases
            matchesTiming = d >= nowStr;
          }

          if (!matchesTiming) continue;

          // Deduplication: check if already notified
          const dedupKey = SUB_KEYS.alertSent(email, rel.id, alertTiming);
          const alreadySent = await kv.get<number>(dedupKey);
          if (!alreadySent) {
            matchingReleases.push(rel);
          }
        }

        if (matchingReleases.length > 0) {
          // Limit to max 5 items in a single digest email to keep it clean
          const alertBatch = matchingReleases.slice(0, 5);
          const unsubscribeToken = createUnsubscribeToken(email, personId);
          const unsubscribeUrl = `${siteUrl}/api/subscriptions/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

          const result = await sendReleaseAlertEmail({
            to: email,
            artistName: personName,
            releases: alertBatch,
            artistUrl,
            manageUrl,
            unsubscribeUrl,
          });

          if (result.success) {
            emailsSent++;
            releasesNotified += alertBatch.length;

            // Mark deduplication keys with 60 days TTL
            for (const rel of alertBatch) {
              const dedupKey = SUB_KEYS.alertSent(email, rel.id, alertTiming);
              await kv.set(dedupKey, 1, 60 * 86400);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedArtists: artistIds.length,
      emailsSent,
      releasesNotified,
      durationMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Cron check-alerts error:", err);
    return NextResponse.json(
      { error: "Internal cron error", details: err?.message },
      { status: 500 }
    );
  }
}
