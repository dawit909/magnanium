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

interface MovieDetailsWithReleases {
  runtime?: number;
  release_dates?: TMDBReleaseDatesResponse;
}

export async function extractMovieReleases(
  movie: TMDBCreditItem,
  roleStr: string,
  ctx: ReleaseExtractionContext
): Promise<FormattedRelease[]> {
  const movieTitle = movie.title || movie.name || "Movie";

  if (ctx.excludeShorts && /\b(short|short film)\b/i.test(movieTitle)) {
    return [];
  }

  const { data: movieDetails } = await tmdbFetch<MovieDetailsWithReleases>(
    `/movie/${movie.id}`,
    { append_to_response: "release_dates" },
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

        if (!mapped || !isDateInWindow(dateStr, ctx.alert, ctx.window, ctx.nowStr, ctx.oneYearAgoStr, ctx.sevenDaysFromNowStr)) {
          continue;
        }

        const noteSlug = rd.note && rd.note.trim() ? `-${rd.note.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "";

        candidates.push({
          id: `${movie.id}-${rd.type}-${countryData.iso_3166_1}-${dateStr}${noteSlug}`,
          mediaType: "movie",
          movieId: movie.id,
          movieTitle,
          overview: movie.overview || "",
          posterPath: movie.poster_path,
          releaseDate: dateStr,
          releaseType: mapped.category,
          releaseTypeLabel: mapped.label,
          country: countryData.iso_3166_1,
          role: roleStr,
          tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
        });
      }
    }
  }

  // Fallback to general movie.release_date if no country release entries matched
  if (candidates.length === 0 && movie.release_date) {
    const dateStr = movie.release_date;
    if (isDateInWindow(dateStr, ctx.alert, ctx.window, ctx.nowStr, ctx.oneYearAgoStr, ctx.sevenDaysFromNowStr)) {
      candidates.push({
        id: `${movie.id}-general-${dateStr}`,
        mediaType: "movie",
        movieId: movie.id,
        movieTitle,
        overview: movie.overview || "",
        posterPath: movie.poster_path,
        releaseDate: dateStr,
        releaseType: "cinema",
        releaseTypeLabel: "Theatrical",
        country: ctx.country,
        role: roleStr,
        tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
      });
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

  if (ctx.excludeShorts && /\b(short|short film)\b/i.test(showTitle)) {
    return [];
  }

  const { data: tvDetails } = await tmdbFetch<TvDetails>(
    `/tv/${tvShow.id}`,
    {},
    43200,
    ctx.clientKey
  );

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

      if (!dateStr || !isDateInWindow(dateStr, ctx.alert, ctx.window, ctx.nowStr, ctx.oneYearAgoStr, ctx.sevenDaysFromNowStr)) {
        continue;
      }

      const seasonTitle = `${tvDetails.name}: ${season.name}`;
      const premiereLabel = season.season_number === 1 ? "Series Premiere" : "Season Premiere";

      candidates.push({
        id: `${tvShow.id}-s${season.season_number}-${dateStr}`,
        mediaType: "tv",
        movieId: tvShow.id,
        movieTitle: seasonTitle,
        overview: season.overview || tvDetails.overview || tvShow.overview || "",
        posterPath: season.poster_path || tvDetails.poster_path || tvShow.poster_path,
        releaseDate: dateStr,
        releaseType: "home",
        releaseTypeLabel: premiereLabel,
        country: showCountry,
        role: roleStr,
        tmdbUrl: `https://www.themoviedb.org/tv/${tvShow.id}`,
      });
    }
  }

  // Fallback to tvShow.first_air_date if no specific seasons matched
  if (candidates.length === 0 && tvShow.first_air_date) {
    const dateStr = tvShow.first_air_date;
    if (isDateInWindow(dateStr, ctx.alert, ctx.window, ctx.nowStr, ctx.oneYearAgoStr, ctx.sevenDaysFromNowStr)) {
      candidates.push({
        id: `${tvShow.id}-general-${dateStr}`,
        mediaType: "tv",
        movieId: tvShow.id,
        movieTitle: showTitle,
        overview: tvShow.overview || "",
        posterPath: tvShow.poster_path,
        releaseDate: dateStr,
        releaseType: "home",
        releaseTypeLabel: "Series Premiere",
        country: showCountry,
        role: roleStr,
        tmdbUrl: `https://www.themoviedb.org/tv/${tvShow.id}`,
      });
    }
  }

  return filterReleasesByType(candidates, ctx.normalizedTypes, ctx.isEarliestOnly);
}
