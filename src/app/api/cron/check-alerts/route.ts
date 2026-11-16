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
import { extractFeedOptions } from "@/lib/feed-options";
import { getRequestSiteUrl } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/constants";
import { mapConcurrent } from "@/lib/async";
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

  const siteUrl = getRequestSiteUrl(request);
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
  const force = request.nextUrl.searchParams.get("force") === "true";

  try {
    const artistIds = await getAllSubscribedArtistIds();
    const boundaries = getDateWindowBoundaries();
    const { nowStr, sevenDaysFromNowStr, thirtyDaysFromNowStr } = boundaries;

    let emailsSent = 0;
    let releasesNotified = 0;
    const pendingDigests: Array<{
      email: string;
      artist: string;
      frequency: string;
      alertTiming: string;
      releaseCount: number;
      sampleTitles: string[];
    }> = [];

    // Process artists with bounded concurrency of 6 to prevent serverless timeouts
    await mapConcurrent(artistIds, 6, async (personId) => {
      try {
        const subscriberEmails = await getArtistSubscribers(personId);
        if (!subscriberEmails || subscriberEmails.length === 0) {
          return;
        }

        // Cache raw releases per country for this artist during this cron run
        const countryReleasesCache = new Map<
          string,
          { personName: string; releases: FormattedRelease[]; profilePath?: string | null }
        >();

        for (const email of subscriberEmails) {
          try {
            const user = await getUser(email);
            if (!user || !user.artists[String(personId)]) {
              continue;
            }

            const subInfo = user.artists[String(personId)];
            const frequency = subInfo.frequency || "instant";

            // For weekly / monthly frequency digests, verify sending window interval (unless forced)
            if (!force) {
              if (frequency === "weekly") {
                const weeklyKey = SUB_KEYS.digestSent("weekly", email, personId);
                const alreadySentWeekly = await kv.get<number>(weeklyKey);
                if (alreadySentWeekly) {
                  continue; // Wait until 7-day interval elapses
                }
              } else if (frequency === "monthly") {
                const monthlyKey = SUB_KEYS.digestSent("monthly", email, personId);
                const alreadySentMonthly = await kv.get<number>(monthlyKey);
                if (alreadySentMonthly) {
                  continue; // Wait until 30-day interval elapses
                }
              }
            }

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

            // Apply subscriber RSS filtering options
            const feedOpts = extractFeedOptions(subInfo, country);
            const subscriberFilterOptions = {
              ...feedOpts,
              alert: "announced" as AlertTimingWindow, // keep valid date window for fine-grained timing checks below
              window: "all" as const,
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

              // For instant alerts, check per-release deduplication (unless forced)
              if (frequency === "instant" && !force) {
                const dedupKey = SUB_KEYS.alertSent(email, rel.id, alertTiming);
                const alreadySent = await kv.get<number>(dedupKey);
                if (!alreadySent) {
                  matchingReleases.push(rel);
                }
              } else {
                // Weekly / Monthly digests include candidate releases for the period
                matchingReleases.push(rel);
              }
            }

            if (matchingReleases.length > 0) {
              // Sort releases: for upcoming alerts, soonest release first; for when_released, most recent first
              matchingReleases.sort((a, b) => {
                if (alertTiming === "when_released") {
                  return (b.releaseDate || "") > (a.releaseDate || "") ? 1 : -1;
                }
                return (a.releaseDate || "") > (b.releaseDate || "") ? 1 : -1;
              });

              // Limit to max 5 items in a single digest email to keep it clean
              const alertBatch = matchingReleases.slice(0, 5);
              const unsubscribeToken = createUnsubscribeToken(email, personId);
              const unsubscribeUrl = `${siteUrl}/api/subscriptions/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

              if (dryRun) {
                pendingDigests.push({
                  email,
                  artist: personName,
                  frequency,
                  alertTiming,
                  releaseCount: alertBatch.length,
                  sampleTitles: alertBatch.map((r) => r.movieTitle),
                });
                emailsSent++;
                releasesNotified += alertBatch.length;
              } else {
                const result = await sendReleaseAlertEmail({
                  to: email,
                  artistName: personName,
                  releases: alertBatch,
                  artistUrl,
                  manageUrl,
                  unsubscribeUrl,
                  frequency,
                  artistProfilePath: countryData?.profilePath || subInfo?.profilePath,
                });

                if (result.success) {
                  emailsSent++;
                  releasesNotified += alertBatch.length;

                  if (frequency === "weekly") {
                    const weeklyKey = SUB_KEYS.digestSent("weekly", email, personId);
                    await kv.set(weeklyKey, 1, 7 * 86400);
                  } else if (frequency === "monthly") {
                    const monthlyKey = SUB_KEYS.digestSent("monthly", email, personId);
                    await kv.set(monthlyKey, 1, 30 * 86400);
                  }

                  // Mark deduplication keys with TTL
                  for (const rel of alertBatch) {
                    const dedupKey = SUB_KEYS.alertSent(email, rel.id, alertTiming);
                    await kv.set(dedupKey, 1, AUTH_CONFIG.ALERT_DEDUP_TTL_SECONDS);
                  }
                }
              }
            }
          } catch (subErr) {
            console.error(`Error processing alerts for subscriber ${email} on artist ${personId}:`, subErr);
          }
        }
      } catch (artistErr) {
        console.error(`Error processing artist ${personId} in alert cron:`, artistErr);
      }
    });

    return NextResponse.json({
      success: true,
      dryRun,
      force,
      processedArtists: artistIds.length,
      emailsSent,
      releasesNotified,
      pendingDigests: dryRun ? pendingDigests : undefined,
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
