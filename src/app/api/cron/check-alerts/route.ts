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
import { getDateWindowBoundaries, filterReleases } from "@/lib/feed-filter";
import { DEFAULT_FEED_OPTIONS } from "@/lib/feed-options";
import { kv } from "@/lib/kv";
import { createPersonSlug } from "@/lib/slug";
import { FormattedRelease, AlertTimingWindow } from "@/types/tmdb";

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

      // Cache raw releases per country for this artist during this cron run
      const countryReleasesCache = new Map<
        string,
        { personName: string; releases: FormattedRelease[]; profilePath?: string | null }
      >();

      for (const email of subscriberEmails) {
        const user = await getUser(email);
        if (!user || !user.artists[String(personId)]) {
          continue;
        }

        const subInfo = user.artists[String(personId)];
        const country = (subInfo.country || "US").toUpperCase();

        let countryData = countryReleasesCache.get(country);
        if (!countryData) {
          const fetched = await getPersonReleases({
            personId,
            country,
            roles: ["all"],
            types: ["cinema", "home", "tv", "premiere"],
            excludeShorts: false,
            excludeReReleases: false,
            excludeUncredited: false,
            window: "all",
            alert: "announced",
          });
          countryData = {
            personName: fetched.personName,
            releases: fetched.releases,
            profilePath: fetched.profilePath,
          };
          countryReleasesCache.set(country, countryData);
        }

        const { personName, releases } = countryData;
        if (!releases || releases.length === 0) {
          continue;
        }

        const slug = createPersonSlug(personId, personName);
        const artistUrl = `${siteUrl}/${slug}`;
        const manageUrl = `${siteUrl}/feeds`;

        // Apply all subscriber RSS filtering options:
        // - roles: actor, director, writer, producer, crew
        // - types: cinema, home, tv, premiere, earliest
        // - country: already fetched per country above
        // - excludeShorts: exclude short films
        // - excludeReReleases: exclude re-releases / remasters
        // - excludeUncredited: exclude uncredited / cameo appearances
        const subscriberFilterOptions = {
          roles:
            subInfo.roles && subInfo.roles.length > 0
              ? subInfo.roles
              : DEFAULT_FEED_OPTIONS.roles,
          types:
            subInfo.types && subInfo.types.length > 0
              ? subInfo.types
              : DEFAULT_FEED_OPTIONS.types,
          country,
          alert: "announced" as AlertTimingWindow, // keep valid date window for fine-grained timing checks below
          window: "all" as const,
          excludeShorts:
            subInfo.excludeShorts !== undefined
              ? subInfo.excludeShorts
              : DEFAULT_FEED_OPTIONS.excludeShorts,
          excludeReReleases:
            subInfo.excludeReReleases !== undefined
              ? subInfo.excludeReReleases
              : DEFAULT_FEED_OPTIONS.excludeReReleases,
          excludeUncredited:
            subInfo.excludeUncredited !== undefined
              ? subInfo.excludeUncredited
              : DEFAULT_FEED_OPTIONS.excludeUncredited,
        };

        const filteredCandidateReleases = filterReleases(releases, subscriberFilterOptions);

        const alertTiming = subInfo.alert || "announced";
        const matchingReleases: FormattedRelease[] = [];

        for (const rel of filteredCandidateReleases) {
          const d = rel.releaseDate;
          if (!d) continue;

          let matchesTiming = false;

          if (alertTiming === "when_released") {
            // Released within the past year or recently (past releases)
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
          // Sort releases: for upcoming alerts, soonest release first; for when_released, most recent first
          matchingReleases.sort((a, b) => {
            if (alertTiming === "when_released") {
              return b.releaseDate > a.releaseDate ? 1 : -1;
            }
            return a.releaseDate > b.releaseDate ? 1 : -1;
          });

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
            artistProfilePath: countryData?.profilePath || subInfo?.profilePath,
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
