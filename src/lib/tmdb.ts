import {
  TMDBPersonSearchResult,
  TMDBPersonCreditsResponse,
  TMDBReleaseDatesResponse,
  FormattedRelease,
  FeedFilterOptions,
  ReleaseTypeCategory,
  TMDBCreditItem,
} from "@/types/tmdb";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const SERVER_API_KEY = process.env.TMDB_API_KEY || "";
const SERVER_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || "";

export function getResolvedApiKey(clientKey?: string | null): string {
  return (clientKey && clientKey.trim()) || SERVER_API_KEY;
}

export function mapReleaseType(type: number): { category: ReleaseTypeCategory; label: string } {
  switch (type) {
    case 1:
      return { category: "premiere", label: "Premiere" };
    case 2:
      return { category: "theatrical", label: "Theatrical" };
    case 3:
      return { category: "theatrical", label: "Theatrical" };
    case 4:
      return { category: "digital", label: "Digital / Streaming" };
    case 5:
      return { category: "physical", label: "Physical" };
    case 6:
      return { category: "other", label: "TV" };
    default:
      return { category: "other", label: "Release" };
  }
}

function getFetchOptions(customKey?: string): { url: (endpoint: string, params?: Record<string, string>) => string; headers: Record<string, string> } {
  const apiKey = getResolvedApiKey(customKey);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (!customKey && SERVER_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${SERVER_ACCESS_TOKEN}`;
  }

  const buildUrl = (endpoint: string, params: Record<string, string> = {}) => {
    const url = new URL(`${TMDB_API_BASE}${endpoint}`);
    if (apiKey) {
      url.searchParams.set("api_key", apiKey);
    }
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  };

  return { url: buildUrl, headers };
}

/**
 * Search TMDB for an actor or director
 */
export async function searchPerson(query: string, customApiKey?: string): Promise<{ results: TMDBPersonSearchResult[]; noApiKey?: boolean }> {
  const { url, headers } = getFetchOptions(customApiKey);
  const hasAuth = SERVER_ACCESS_TOKEN || getResolvedApiKey(customApiKey);

  if (!hasAuth) {
    return { results: [], noApiKey: true };
  }

  try {
    const res = await fetch(url("/search/person", { query }), {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { results: [], noApiKey: true };
      }
      return { results: [] };
    }

    const data = await res.json();
    return { results: (data.results || []).slice(0, 8) };
  } catch (err) {
    console.error("TMDB search error:", err);
    return { results: [] };
  }
}

/**
 * Get person details
 */
export async function getPersonDetails(personId: number, customApiKey?: string) {
  const { url, headers } = getFetchOptions(customApiKey);

  try {
    const res = await fetch(url(`/person/${personId}`), {
      headers,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { id: personId, name: "Artist" };
    return await res.json();
  } catch {
    return { id: personId, name: "Artist" };
  }
}

/**
 * Get person movie credits
 */
export async function getPersonCredits(personId: number, customApiKey?: string): Promise<TMDBPersonCreditsResponse> {
  const { url, headers } = getFetchOptions(customApiKey);

  try {
    const res = await fetch(url(`/person/${personId}/movie_credits`), {
      headers,
      next: { revalidate: 21600 },
    });

    if (!res.ok) return { id: personId, cast: [], crew: [] };
    return await res.json();
  } catch (err) {
    console.error("Error fetching credits:", err);
    return { id: personId, cast: [], crew: [] };
  }
}

interface MovieDetailsWithReleases {
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  release_dates?: TMDBReleaseDatesResponse;
}

/**
 * Fetch movie details along with release dates in a single API call
 */
export async function getMovieDetails(movieId: number, customApiKey?: string): Promise<MovieDetailsWithReleases | null> {
  const { url, headers } = getFetchOptions(customApiKey);

  try {
    const res = await fetch(url(`/movie/${movieId}`, { append_to_response: "release_dates" }), {
      headers,
      next: { revalidate: 43200 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Compile formatted movie releases for person
 */
export async function getPersonReleases(
  options: FeedFilterOptions,
  customApiKey?: string
): Promise<{ personName: string; releases: FormattedRelease[] }> {
  const {
    personId,
    roles = ["director", "actor"],
    types = ["theatrical", "digital"],
    country = "US",
    window = "all",
    excludeShorts = false,
  } = options;

  const [person, credits] = await Promise.all([
    getPersonDetails(personId, customApiKey),
    getPersonCredits(personId, customApiKey),
  ]);

  const personName = person.name || "Artist";
  const candidateMap = new Map<number, { movie: TMDBCreditItem; roles: string[] }>();

  const addCandidate = (item: TMDBCreditItem, roleStr: string) => {
    if (!item.id || !item.title) return;
    const existing = candidateMap.get(item.id);
    if (existing) {
      if (!existing.roles.includes(roleStr)) existing.roles.push(roleStr);
    } else {
      candidateMap.set(item.id, { movie: item, roles: [roleStr] });
    }
  };

  const checkRole = (r: string) => roles.includes("all") || roles.includes(r.toLowerCase());

  if (credits.crew) {
    for (const item of credits.crew) {
      const job = (item.job || "").toLowerCase();
      const dept = (item.department || "").toLowerCase();

      // Skip passive "Thanks" or "Special Thanks" credits
      if (job.includes("thanks") || dept === "crew") continue;

      if (checkRole("director") && (job.includes("director") || dept === "directing")) {
        addCandidate(item, "Director");
      } else if (checkRole("writer") && (job.includes("writer") || job.includes("screenplay") || dept === "writing")) {
        addCandidate(item, `Writer (${item.job || "Screenplay"})`);
      } else if (checkRole("producer") && (job.includes("producer") || dept === "production")) {
        addCandidate(item, `Producer (${item.job || "Producer"})`);
      }
    }
  }

  if (credits.cast && checkRole("actor")) {
    for (const item of credits.cast) {
      // Include all acting credits including guest, cameo, and special appearances
      addCandidate(item, item.character ? `Actor (${item.character})` : "Actor");
    }
  }

  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => {
    const dateA = a.movie.release_date || "0000-00-00";
    const dateB = b.movie.release_date || "0000-00-00";
    return dateB.localeCompare(dateA);
  });

  const sliceCandidates = candidateList.slice(0, 30);
  const nowStr = new Date().toISOString().split("T")[0];
  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const formattedReleases: FormattedRelease[] = [];

  await Promise.all(
    sliceCandidates.map(async ({ movie, roles: movieRoles }) => {
      // Check for title-based shorts
      if (excludeShorts && /\b(short|short film)\b/i.test(movie.title)) {
        return;
      }

      const movieDetails = await getMovieDetails(movie.id, customApiKey);

      // Exclude short films: runtime between 1 and 39 minutes
      if (excludeShorts && movieDetails?.runtime && movieDetails.runtime > 0 && movieDetails.runtime < 40) {
        return;
      }

      let foundSpecific = false;
      const releaseDatesData = movieDetails?.release_dates;

      if (releaseDatesData && releaseDatesData.results) {
        const countryData =
          releaseDatesData.results.find((r) => r.iso_3166_1.toUpperCase() === country.toUpperCase()) ||
          releaseDatesData.results.find((r) => r.iso_3166_1 === "US") ||
          releaseDatesData.results[0];

        if (countryData && countryData.release_dates) {
          for (const rd of countryData.release_dates) {
            const dateStr = rd.release_date ? rd.release_date.split("T")[0] : "";
            if (!dateStr) continue;

            const { category, label } = mapReleaseType(rd.type);
            if (!types.includes(category)) continue;
            if (window === "upcoming" && dateStr < nowStr) continue;
            if (window === "all" && dateStr < oneYearAgoStr) continue;

            formattedReleases.push({
              id: `${movie.id}-${rd.type}-${countryData.iso_3166_1}-${dateStr}`,
              movieId: movie.id,
              movieTitle: movie.title,
              overview: movie.overview || "",
              posterPath: movie.poster_path,
              releaseDate: dateStr,
              releaseType: category,
              releaseTypeLabel: label,
              country: countryData.iso_3166_1,
              role: movieRoles.join(", "),
              tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
            });
            foundSpecific = true;
          }
        }
      }

      if (!foundSpecific && movie.release_date) {
        const dateStr = movie.release_date;
        if (window === "upcoming" && dateStr < nowStr) return;
        if (window === "all" && dateStr < oneYearAgoStr) return;

        formattedReleases.push({
          id: `${movie.id}-general-${dateStr}`,
          movieId: movie.id,
          movieTitle: movie.title,
          overview: movie.overview || "",
          posterPath: movie.poster_path,
          releaseDate: dateStr,
          releaseType: "theatrical",
          releaseTypeLabel: "Theatrical",
          country,
          role: movieRoles.join(", "),
          tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
        });
      }
    })
  );

  formattedReleases.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return { personName, releases: formattedReleases };
}
