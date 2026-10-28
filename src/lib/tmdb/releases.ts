import {
  FormattedRelease,
  TMDBCreditItem,
  TMDBReleaseDatesResponse,
  TvDetails,
} from "@/types/tmdb";
import { tmdbFetch } from "./client";

export function mapReleaseType(
  type: number,
  note?: string
): { category: "cinema" | "home"; label: string } | null {
  const cleanNote = note ? note.trim() : "";
  switch (type) {
    case 2:
    case 3:
      return { category: "cinema", label: "Theatrical" };
    case 4: {
      const isRedundant =
        !cleanNote ||
        cleanNote.toLowerCase() === "digital" ||
        cleanNote.toLowerCase() === "digital release";
      return {
        category: "home",
        label: isRedundant ? "Digital" : `Digital (${cleanNote})`,
      };
    }
    case 5:
      return { category: "home", label: "Physical" };
    case 1:
      return { category: "home", label: "Premiere" };
    default:
      // Excludes cable/TV rebroadcast (type 6) and unrecognized types
      return null;
  }
}

export function isDateInWindow(
  dateStr: string,
  alert: "announced" | "release_day" | "week_before",
  window: "upcoming" | "all",
  nowStr: string,
  oneYearAgoStr: string,
  sevenDaysFromNowStr?: string
): boolean {
  if (!dateStr) return false;
  if (alert === "release_day" && dateStr > nowStr) return false;
  if (alert === "week_before" && sevenDaysFromNowStr && dateStr > sevenDaysFromNowStr) return false;
  if (window === "upcoming" && dateStr < nowStr) return false;
  if (window === "all" && dateStr < oneYearAgoStr) return false;
  return true;
}

export function filterReleasesByType(
  candidates: FormattedRelease[],
  normalizedTypes: string[],
  isEarliestOnly: boolean
): FormattedRelease[] {
  if (candidates.length === 0) return [];

  if (isEarliestOnly) {
    const sorted = [...candidates].sort((a, b) =>
      a.releaseDate.localeCompare(b.releaseDate)
    );
    const earliest = sorted[0];
    return [
      {
        ...earliest,
        releaseTypeLabel: `${earliest.releaseTypeLabel} (Earliest)`,
      },
    ];
  }

  return candidates.filter((rel) => normalizedTypes.includes(rel.releaseType));
}

export interface ReleaseExtractionContext {
  country: string;
  window: "upcoming" | "all";
  alert: "announced" | "release_day" | "week_before";
  excludeShorts: boolean;
  normalizedTypes: string[];
  isEarliestOnly: boolean;
  nowStr: string;
  oneYearAgoStr: string;
  sevenDaysFromNowStr: string;
  clientKey?: string;
}

interface RawProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  display_priority?: number;
}

interface RawCountryProviders {
  link?: string;
  flatrate?: RawProviderEntry[];
  rent?: RawProviderEntry[];
  buy?: RawProviderEntry[];
}

interface RawWatchProvidersResponse {
  results?: Record<string, RawCountryProviders>;
}

interface MovieDetailsWithReleases {
  runtime?: number;
  release_dates?: TMDBReleaseDatesResponse;
  "watch/providers"?: RawWatchProvidersResponse;
  credits?: {
    cast?: { name: string; order?: number }[];
    crew?: { name: string; job?: string; department?: string }[];
  };
}

export function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const PROVIDER_NAME_PATTERNS: Array<[RegExp, string]> = [
  [/^Paramount/i, "Paramount+"],
  [/^Amazon Prime Video/i, "Prime Video"],
  [/^Amazon Video/i, "Amazon Video"],
  [/^Apple TV/i, "Apple TV"],
  [/^Disney/i, "Disney+"],
  [/^(HBO|Max)/i, "Max"],
  [/^Netflix/i, "Netflix"],
  [/^Hulu/i, "Hulu"],
  [/^Peacock/i, "Peacock"],
  [/^Google Play/i, "Google Play"],
  [/^YouTube/i, "YouTube"],
];
const PROVIDER_TIER_SUFFIX_REGEX =
  /\s+(Standard with Ads|with Ads|Premium|Essential|Channel|Basic with Ads|Store)$/i;

function cleanProviderName(name: string): string {
  const trimmed = name.trim();
  for (const [pattern, replacement] of PROVIDER_NAME_PATTERNS) {
    if (pattern.test(trimmed)) return replacement;
  }
  return trimmed.replace(PROVIDER_TIER_SUFFIX_REGEX, "").trim();
}

function getDeduplicatedProviderNames(
  entries?: RawProviderEntry[],
  limit = 4
): string[] {
  if (!entries || entries.length === 0) return [];
  const seen = new Set<string>();
  const names: string[] = [];

  const sorted = [...entries].sort(
    (a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99)
  );

  for (const item of sorted) {
    const cleaned = cleanProviderName(item.provider_name);
    if (cleaned && !seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase());
      names.push(cleaned);
      if (names.length >= limit) break;
    }
  }
  return names;
}

export function extractWatchProviders(
  rawProvidersData: RawWatchProvidersResponse | undefined,
  targetCountry: string
) {
  if (!rawProvidersData?.results) return null;

  const countryUpper = targetCountry.toUpperCase();
  const countryData =
    rawProvidersData.results[countryUpper] ||
    rawProvidersData.results["US"] ||
    null;

  if (!countryData) return null;

  const stream = getDeduplicatedProviderNames(countryData.flatrate, 4);
  const rent = getDeduplicatedProviderNames(countryData.rent, 3);
  const buy = getDeduplicatedProviderNames(countryData.buy, 3);

  if (stream.length === 0 && rent.length === 0 && buy.length === 0) {
    return null;
  }

  return {
    link: countryData.link,
    stream: stream.length > 0 ? stream : undefined,
    rent: rent.length > 0 ? rent : undefined,
    buy: buy.length > 0 ? buy : undefined,
  };
}

export function extractMovieCredits(credits?: MovieDetailsWithReleases["credits"]): {
  director: string | null;
  writer: string | null;
  stars: string[] | null;
} {
  if (!credits) {
    return { director: null, writer: null, stars: null };
  }

  const directors: string[] = [];
  const writers: string[] = [];
  const seenDirectors = new Set<string>();
  const seenWriters = new Set<string>();

  if (credits.crew) {
    for (const c of credits.crew) {
      const name = c.name?.trim();
      if (!name) continue;

      if (c.job === "Director" && !seenDirectors.has(name)) {
        seenDirectors.add(name);
        directors.push(name);
      } else if (
        (c.job === "Screenplay" || c.job === "Writer") &&
        !seenWriters.has(name)
      ) {
        seenWriters.add(name);
        writers.push(name);
      }
    }
  }

  const stars = credits.cast
    ?.slice(0, 3)
    .map((c) => c.name?.trim())
    .filter(Boolean) as string[] | undefined;

  return {
    director: directors.length > 0 ? directors.join(", ") : null,
    writer: writers.length > 0 ? writers.join(", ") : null,
    stars: stars && stars.length > 0 ? stars : null,
  };
}

export function extractTvCredits(
  createdBy?: { id?: number; name: string }[],
  credits?: { cast?: { name: string; order?: number }[] }
): {
  creator: string | null;
  stars: string[] | null;
} {
  const creators = createdBy
    ?.map((c) => c.name?.trim())
    .filter(Boolean) as string[] | undefined;

  const stars = credits?.cast
    ?.slice(0, 3)
    .map((c) => c.name?.trim())
    .filter(Boolean) as string[] | undefined;

  return {
    creator: creators && creators.length > 0 ? creators.join(", ") : null,
    stars: stars && stars.length > 0 ? stars : null,
  };
}

function isShortFilmTitle(title: string): boolean {
  return /\b(short|short film)\b/i.test(title);
}

function createReleaseItem(params: {
  id: string;
  mediaType: "movie" | "tv";
  movieId: number;
  movieTitle: string;
  overview?: string;
  posterPath?: string | null;
  releaseDate: string;
  releaseType: "cinema" | "home";
  releaseTypeLabel: string;
  country: string;
  role: string;
  watchProviders?: FormattedRelease["watchProviders"];
  director?: string | null;
  writer?: string | null;
  stars?: string[] | null;
  runtime?: string | null;
}): FormattedRelease {
  return {
    id: params.id,
    mediaType: params.mediaType,
    movieId: params.movieId,
    movieTitle: params.movieTitle,
    overview: params.overview || "",
    posterPath: params.posterPath || null,
    releaseDate: params.releaseDate,
    releaseType: params.releaseType,
    releaseTypeLabel: params.releaseTypeLabel,
    country: params.country,
    role: params.role,
    tmdbUrl: `https://www.themoviedb.org/${params.mediaType}/${params.movieId}`,
    watchProviders: params.watchProviders || null,
    director: params.director || null,
    writer: params.writer || null,
    stars: params.stars && params.stars.length > 0 ? params.stars : null,
    runtime: params.runtime || null,
  };
}

export async function extractMovieReleases(
  movie: TMDBCreditItem,
  roleStr: string,
  ctx: ReleaseExtractionContext
): Promise<FormattedRelease[]> {
  const movieTitle = movie.title || movie.name || "Movie";

  if (ctx.excludeShorts && isShortFilmTitle(movieTitle)) {
    return [];
  }

  const { data: movieDetails } = await tmdbFetch<MovieDetailsWithReleases>(
    `/movie/${movie.id}`,
    { append_to_response: "release_dates,watch/providers,credits" },
    43200,
    ctx.clientKey
  );

  // Exclude short films by runtime (1 - 39 minutes)
  if (
    ctx.excludeShorts &&
    movieDetails?.runtime &&
    movieDetails.runtime > 0 &&
    movieDetails.runtime < 40
  ) {
    return [];
  }

  const watchProviders = extractWatchProviders(
    movieDetails?.["watch/providers"],
    ctx.country
  );

  const { director, writer, stars } = extractMovieCredits(movieDetails?.credits);
  const runtime = formatRuntime(movieDetails?.runtime);

  const candidates: FormattedRelease[] = [];
  const releaseDatesData = movieDetails?.release_dates;

  if (releaseDatesData?.results?.length) {
    const countryData =
      releaseDatesData.results.find(
        (r) => r.iso_3166_1.toUpperCase() === ctx.country.toUpperCase()
      ) ||
      releaseDatesData.results.find((r) => r.iso_3166_1 === "US") ||
      releaseDatesData.results[0];

    if (countryData?.release_dates) {
      for (const rd of countryData.release_dates) {
        const dateStr = rd.release_date ? rd.release_date.split("T")[0] : "";
        const mapped = mapReleaseType(rd.type, rd.note);

        if (
          !mapped ||
          !isDateInWindow(
            dateStr,
            ctx.alert,
            ctx.window,
            ctx.nowStr,
            ctx.oneYearAgoStr,
            ctx.sevenDaysFromNowStr
          )
        ) {
          continue;
        }

        const noteSlug =
          rd.note && rd.note.trim()
            ? `-${rd.note.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
            : "";

        candidates.push(
          createReleaseItem({
            id: `${movie.id}-${rd.type}-${countryData.iso_3166_1}-${dateStr}${noteSlug}`,
            mediaType: "movie",
            movieId: movie.id,
            movieTitle,
            overview: movie.overview,
            posterPath: movie.poster_path,
            releaseDate: dateStr,
            releaseType: mapped.category,
            releaseTypeLabel: mapped.label,
            country: countryData.iso_3166_1,
            role: roleStr,
            watchProviders,
            director,
            writer,
            stars,
            runtime,
          })
        );
      }
    }
  }

  // Fallback to general movie.release_date if no specific country entries matched
  if (candidates.length === 0 && movie.release_date) {
    const dateStr = movie.release_date;
    if (
      isDateInWindow(
        dateStr,
        ctx.alert,
        ctx.window,
        ctx.nowStr,
        ctx.oneYearAgoStr,
        ctx.sevenDaysFromNowStr
      )
    ) {
      candidates.push(
        createReleaseItem({
          id: `${movie.id}-general-${dateStr}`,
          mediaType: "movie",
          movieId: movie.id,
          movieTitle,
          overview: movie.overview,
          posterPath: movie.poster_path,
          releaseDate: dateStr,
          releaseType: "cinema",
          releaseTypeLabel: "Theatrical",
          country: ctx.country,
          role: roleStr,
          watchProviders,
          director,
          writer,
          stars,
          runtime,
        })
      );
    }
  }

  return filterReleasesByType(candidates, ctx.normalizedTypes, ctx.isEarliestOnly);
}

export async function extractTvReleases(
  tvShow: TMDBCreditItem,
  roleStr: string,
  ctx: ReleaseExtractionContext
): Promise<FormattedRelease[]> {
  const showTitle = tvShow.name || tvShow.title || "TV Series";

  if (ctx.excludeShorts && isShortFilmTitle(showTitle)) {
    return [];
  }

  const { data: tvDetails } = await tmdbFetch<
    TvDetails & {
      "watch/providers"?: RawWatchProvidersResponse;
      credits?: {
        cast?: { name: string; order?: number }[];
        crew?: { name: string; job?: string; department?: string }[];
      };
    }
  >(
    `/tv/${tvShow.id}`,
    { append_to_response: "watch/providers,credits" },
    43200,
    ctx.clientKey
  );

  const watchProviders = extractWatchProviders(
    tvDetails?.["watch/providers"],
    ctx.country
  );

  const { creator: director, stars } = extractTvCredits(
    tvDetails?.created_by,
    tvDetails?.credits
  );
  const runtime =
    tvDetails?.episode_run_time && tvDetails.episode_run_time.length > 0
      ? formatRuntime(tvDetails.episode_run_time[0])
      : null;

  const candidates: FormattedRelease[] = [];
  const showCountry = tvDetails?.origin_country?.[0] || ctx.country;

  if (tvDetails?.seasons && tvDetails.seasons.length > 0) {
    const validSeasons = tvDetails.seasons.filter((s) => s.season_number > 0);
    for (const season of validSeasons) {
      const dateStr =
        season.air_date ||
        (tvDetails.next_episode_to_air?.season_number === season.season_number
          ? tvDetails.next_episode_to_air.air_date
          : null);

      if (
        !dateStr ||
        !isDateInWindow(
          dateStr,
          ctx.alert,
          ctx.window,
          ctx.nowStr,
          ctx.oneYearAgoStr,
          ctx.sevenDaysFromNowStr
        )
      ) {
        continue;
      }

      const seasonTitle = `${tvDetails.name}: ${season.name}`;
      const premiereLabel = season.season_number === 1 ? "Series Premiere" : "Season Premiere";

      candidates.push(
        createReleaseItem({
          id: `${tvShow.id}-s${season.season_number}-${dateStr}`,
          mediaType: "tv",
          movieId: tvShow.id,
          movieTitle: seasonTitle,
          overview: season.overview || tvDetails.overview || tvShow.overview,
          posterPath: season.poster_path || tvDetails.poster_path || tvShow.poster_path,
          releaseDate: dateStr,
          releaseType: "home",
          releaseTypeLabel: premiereLabel,
          country: showCountry,
          role: roleStr,
          watchProviders,
          director,
          stars,
          runtime,
        })
      );
    }
  }

  // Fallback to tvShow.first_air_date if no specific seasons matched
  if (candidates.length === 0 && tvShow.first_air_date) {
    const dateStr = tvShow.first_air_date;
    if (
      isDateInWindow(
        dateStr,
        ctx.alert,
        ctx.window,
        ctx.nowStr,
        ctx.oneYearAgoStr,
        ctx.sevenDaysFromNowStr
      )
    ) {
      candidates.push(
        createReleaseItem({
          id: `${tvShow.id}-general-${dateStr}`,
          mediaType: "tv",
          movieId: tvShow.id,
          movieTitle: showTitle,
          overview: tvShow.overview,
          posterPath: tvShow.poster_path,
          releaseDate: dateStr,
          releaseType: "home",
          releaseTypeLabel: "Series Premiere",
          country: showCountry,
          role: roleStr,
          watchProviders,
          director,
          stars,
          runtime,
        })
      );
    }
  }

  return filterReleasesByType(candidates, ctx.normalizedTypes, ctx.isEarliestOnly);
}
