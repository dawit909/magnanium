import {
  TMDBPersonSearchResult,
  TMDBPersonCreditsResponse,
  TMDBReleaseDatesResponse,
  FormattedRelease,
  FeedFilterOptions,
  ReleaseTypeCategory,
  TMDBCreditItem,
  TvDetails,
} from "@/types/tmdb";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const SERVER_API_KEY = process.env.TMDB_API_KEY || "";
const SERVER_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || "";

export function getResolvedApiKey(clientKey?: string | null): string {
  return (clientKey && clientKey.trim()) || SERVER_API_KEY;
}

export function mapReleaseType(type: number): { category: "cinema" | "home"; label: string } {
  switch (type) {
    case 2:
    case 3:
      return { category: "cinema", label: "Theatrical" };
    case 4:
      return { category: "home", label: "Digital" };
    case 5:
      return { category: "home", label: "Physical" };
    case 6:
      return { category: "home", label: "TV Broadcast" };
    case 1:
      return { category: "home", label: "Premiere" };
    default:
      return { category: "home", label: "Home" };
  }
}

function getFetchOptions(customKey?: string): {
  url: (endpoint: string, params?: Record<string, string>) => string;
  headers: Record<string, string>;
} {
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
 * Search TMDB for an artist (director, actor, crew, creator)
 */
export async function searchPerson(
  query: string,
  customApiKey?: string
): Promise<{ results: TMDBPersonSearchResult[]; noApiKey?: boolean }> {
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
 * Get person combined credits (both movies and TV shows)
 */
export async function getPersonCredits(
  personId: number,
  customApiKey?: string
): Promise<TMDBPersonCreditsResponse> {
  const { url, headers } = getFetchOptions(customApiKey);

  try {
    const res = await fetch(url(`/person/${personId}/combined_credits`), {
      headers,
      next: { revalidate: 21600 },
    });

    if (!res.ok) return { id: personId, cast: [], crew: [] };
    return await res.json();
  } catch (err) {
    console.error("Error fetching combined credits:", err);
    return { id: personId, cast: [], crew: [] };
  }
}

export const getPersonCombinedCredits = getPersonCredits;

interface MovieDetailsWithReleases {
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  release_dates?: TMDBReleaseDatesResponse;
}

/**
 * Fetch movie details along with release dates in a single API call
 */
export async function getMovieDetails(
  movieId: number,
  customApiKey?: string
): Promise<MovieDetailsWithReleases | null> {
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
 * Fetch TV show details including season information
 */
export async function getTvDetails(
  tvId: number,
  customApiKey?: string
): Promise<TvDetails | null> {
  const { url, headers } = getFetchOptions(customApiKey);

  try {
    const res = await fetch(url(`/tv/${tvId}`), {
      headers,
      next: { revalidate: 43200 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const ROLE_PRIORITY = ["creator", "director", "writer", "executive producer", "producer", "actor"];

/**
 * Compile formatted movie and TV releases for an artist
 */
export async function getPersonReleases(
  options: FeedFilterOptions,
  customApiKey?: string
): Promise<{ personName: string; releases: FormattedRelease[] }> {
  const {
    personId,
    media = ["movie", "tv"],
    roles = ["actor", "crew"],
    types = ["cinema", "home"],
    country = "US",
    window = "all",
    excludeShorts = false,
  } = options;

  const includeMovies = media.includes("movie");
  const includeTv = media.includes("tv");

  // Normalize release types
  const normalizedTypes = types.map((t) => {
    const lower = t.toLowerCase();
    if (lower === "theatrical") return "cinema";
    if (lower === "digital" || lower === "physical") return "home";
    return lower;
  });

  const isEarliestOnly = normalizedTypes.includes("earliest");

  const [person, credits] = await Promise.all([
    getPersonDetails(personId, customApiKey),
    getPersonCombinedCredits(personId, customApiKey),
  ]);

  const personName = person.name || "Artist";

  // Check roles:
  // "actor" -> Cast credits
  // "crew" / "behind_the_scenes" / "director" / "writer" / "producer" -> Behind the Scenes
  const isActorSelected = roles.includes("all") || roles.includes("actor");
  const isCrewSelected =
    roles.includes("all") ||
    roles.includes("crew") ||
    roles.includes("behind_the_scenes") ||
    roles.includes("director") ||
    roles.includes("writer") ||
    roles.includes("producer");

  const candidateMap = new Map<
    string,
    {
      item: TMDBCreditItem;
      roles: string[];
      mediaType: "movie" | "tv";
    }
  >();

  const addCandidate = (item: TMDBCreditItem, roleStr: string, mediaType: "movie" | "tv") => {
    const key = `${mediaType}-${item.id}`;
    const existing = candidateMap.get(key);
    if (existing) {
      if (!existing.roles.includes(roleStr)) existing.roles.push(roleStr);
    } else {
      candidateMap.set(key, { item, roles: [roleStr], mediaType });
    }
  };

  // 1. Process behind-the-scenes (crew) credits
  if (isCrewSelected && credits.crew) {
    for (const item of credits.crew) {
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      if (mediaType === "movie" && !includeMovies) continue;
      if (mediaType === "tv" && !includeTv) continue;
      if (!item.id || (!item.title && !item.name)) continue;

      const job = (item.job || "").toLowerCase();
      const dept = (item.department || "").toLowerCase();

      if (job.includes("thanks") || dept === "crew") continue;

      // Legacy single-role query compatibility
      if (roles.length === 1 && roles.includes("director") && !job.includes("director") && dept !== "directing") continue;
      if (roles.length === 1 && roles.includes("writer") && !job.includes("writer") && !job.includes("screenplay") && dept !== "writing") continue;
      if (roles.length === 1 && roles.includes("producer") && !job.includes("producer") && dept !== "production") continue;

      let roleLabel = "Crew";
      if (job.includes("director") || dept === "directing") {
        roleLabel = "Director";
      } else if (job.includes("creator") || dept === "creator") {
        roleLabel = "Creator";
      } else if (job.includes("executive producer")) {
        roleLabel = "Executive Producer";
      } else if (job.includes("producer") || dept === "production") {
        roleLabel = "Producer";
      } else if (job.includes("screenplay") || job.includes("writer") || dept === "writing") {
        roleLabel = item.job && item.job.toLowerCase() !== "writer" ? `Writer (${item.job})` : "Writer";
      } else if (item.job) {
        roleLabel = item.job;
      } else if (item.department) {
        roleLabel = item.department;
      }

      addCandidate(item, roleLabel, mediaType);
    }
  }

  // 2. Process actor (cast) credits
  if (isActorSelected && credits.cast) {
    for (const item of credits.cast) {
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      if (mediaType === "movie" && !includeMovies) continue;
      if (mediaType === "tv" && !includeTv) continue;
      if (!item.id || (!item.title && !item.name)) continue;

      // Filter talk shows, late-night guest appearances, and award specials
      if (mediaType === "tv") {
        if (item.genre_ids?.includes(10767) || item.genre_ids?.includes(10763)) continue;
        const charLower = (item.character || "").toLowerCase();
        if (charLower.startsWith("self - guest") || charLower === "self - interviewee") continue;
      }

      const char = (item.character || "").trim();
      const roleLabel = char ? `Actor (${char})` : "Actor";
      addCandidate(item, roleLabel, mediaType);
    }
  }

  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => {
    const dateA = (a.mediaType === "tv" ? a.item.first_air_date : a.item.release_date) || "0000-00-00";
    const dateB = (b.mediaType === "tv" ? b.item.first_air_date : b.item.release_date) || "0000-00-00";
    return dateB.localeCompare(dateA);
  });

  const sliceCandidates = candidateList.slice(0, 40);
  const nowStr = new Date().toISOString().split("T")[0];
  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const formattedReleases: FormattedRelease[] = [];

  await Promise.all(
    sliceCandidates.map(async ({ item, roles: candidateRoles, mediaType }) => {
      // Sort roles by priority: Creator > Director > Writer > Executive Producer > Producer > Actor > others
      const sortedRoles = [...candidateRoles].sort((a, b) => {
        const idxA = ROLE_PRIORITY.findIndex((r) => a.toLowerCase().includes(r));
        const idxB = ROLE_PRIORITY.findIndex((r) => b.toLowerCase().includes(r));
        const orderA = idxA === -1 ? 99 : idxA;
        const orderB = idxB === -1 ? 99 : idxB;
        return orderA - orderB;
      });
      const combinedRole = sortedRoles.join(", ");

      if (mediaType === "movie") {
        const movie = item;
        const movieTitle = movie.title || movie.name || "Movie";

        if (excludeShorts && /\b(short|short film)\b/i.test(movieTitle)) {
          return;
        }

        const movieDetails = await getMovieDetails(movie.id, customApiKey);

        // Exclude short films: runtime between 1 and 39 minutes
        if (excludeShorts && movieDetails?.runtime && movieDetails.runtime > 0 && movieDetails.runtime < 40) {
          return;
        }

        const releaseDatesData = movieDetails?.release_dates;
        const movieCandidateReleases: FormattedRelease[] = [];

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

              // Window filter
              if (window === "upcoming" && dateStr < nowStr) continue;
              if (window === "all" && dateStr < oneYearAgoStr) continue;

              movieCandidateReleases.push({
                id: `${movie.id}-${rd.type}-${countryData.iso_3166_1}-${dateStr}`,
                mediaType: "movie",
                movieId: movie.id,
                movieTitle,
                overview: movie.overview || "",
                posterPath: movie.poster_path,
                releaseDate: dateStr,
                releaseType: category,
                releaseTypeLabel: label,
                country: countryData.iso_3166_1,
                role: combinedRole,
                tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
              });
            }
          }
        }

        // Fallback to movie.release_date if no specific release entries
        if (movieCandidateReleases.length === 0 && movie.release_date) {
          const dateStr = movie.release_date;
          const inWindow = !(window === "upcoming" && dateStr < nowStr) && !(window === "all" && dateStr < oneYearAgoStr);

          if (inWindow) {
            movieCandidateReleases.push({
              id: `${movie.id}-general-${dateStr}`,
              mediaType: "movie",
              movieId: movie.id,
              movieTitle,
              overview: movie.overview || "",
              posterPath: movie.poster_path,
              releaseDate: dateStr,
              releaseType: "cinema",
              releaseTypeLabel: "Theatrical",
              country,
              role: combinedRole,
              tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
            });
          }
        }

        if (movieCandidateReleases.length === 0) return;

        if (isEarliestOnly) {
          movieCandidateReleases.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
          const earliest = movieCandidateReleases[0];
          formattedReleases.push({
            ...earliest,
            releaseTypeLabel: `${earliest.releaseTypeLabel} (Earliest)`,
          });
        } else {
          for (const rel of movieCandidateReleases) {
            if (normalizedTypes.includes(rel.releaseType)) {
              formattedReleases.push(rel);
            }
          }
        }
      } else {
        // mediaType === "tv"
        const tvShow = item;
        const showTitle = tvShow.name || tvShow.title || "TV Series";

        if (excludeShorts && /\b(short|short film)\b/i.test(showTitle)) {
          return;
        }

        const tvDetails = await getTvDetails(tvShow.id, customApiKey);
        const tvCandidateReleases: FormattedRelease[] = [];
        const showCountry = tvDetails?.origin_country?.[0] || country;

        if (tvDetails?.seasons && tvDetails.seasons.length > 0) {
          const validSeasons = tvDetails.seasons.filter((s) => s.season_number > 0);
          for (const season of validSeasons) {
            const dateStr =
              season.air_date ||
              (tvDetails.next_episode_to_air?.season_number === season.season_number
                ? tvDetails.next_episode_to_air.air_date
                : null);

            if (!dateStr) continue;

            // Window filter
            if (window === "upcoming" && dateStr < nowStr) continue;
            if (window === "all" && dateStr < oneYearAgoStr) continue;

            const seasonTitle = `${tvDetails.name}: ${season.name}`;
            const premiereLabel = season.season_number === 1 ? "Series Premiere" : "Season Premiere";

            tvCandidateReleases.push({
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
              role: combinedRole,
              tmdbUrl: `https://www.themoviedb.org/tv/${tvShow.id}`,
            });
          }
        }

        // Fallback to first_air_date if no specific seasons matched
        if (tvCandidateReleases.length === 0 && tvShow.first_air_date) {
          const dateStr = tvShow.first_air_date;
          const inWindow = !(window === "upcoming" && dateStr < nowStr) && !(window === "all" && dateStr < oneYearAgoStr);

          if (inWindow) {
            tvCandidateReleases.push({
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
              role: combinedRole,
              tmdbUrl: `https://www.themoviedb.org/tv/${tvShow.id}`,
            });
          }
        }

        if (tvCandidateReleases.length === 0) return;

        if (isEarliestOnly) {
          tvCandidateReleases.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
          const earliest = tvCandidateReleases[0];
          formattedReleases.push({
            ...earliest,
            releaseTypeLabel: `${earliest.releaseTypeLabel} (Earliest)`,
          });
        } else {
          for (const rel of tvCandidateReleases) {
            if (normalizedTypes.includes(rel.releaseType)) {
              formattedReleases.push(rel);
            }
          }
        }
      }
    })
  );

  formattedReleases.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return { personName, releases: formattedReleases };
}
