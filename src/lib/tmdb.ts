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

export function getResolvedApiKey(clientKey?: string | null): string {
  return (clientKey && clientKey.trim()) || process.env.TMDB_API_KEY || "";
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

function buildUrl(endpoint: string, apiKey: string, params: Record<string, string> = {}): string {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Search TMDB for an actor or director
 */
export async function searchPerson(query: string, customApiKey?: string): Promise<{ results: TMDBPersonSearchResult[]; noApiKey?: boolean }> {
  const apiKey = getResolvedApiKey(customApiKey);

  if (!apiKey) {
    // Check if query matches mock fallback
    const mock = getMockPersons(query);
    return { results: mock, noApiKey: true };
  }

  try {
    const res = await fetch(buildUrl("/search/person", apiKey, { query }), {
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
  const apiKey = getResolvedApiKey(customApiKey);
  if (!apiKey) {
    return MOCK_PERSONS.find((p) => p.id === personId) || { id: personId, name: "Artist" };
  }

  try {
    const res = await fetch(buildUrl(`/person/${personId}`, apiKey), {
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
  const apiKey = getResolvedApiKey(customApiKey);
  if (!apiKey) {
    return getMockCredits(personId);
  }

  try {
    const res = await fetch(buildUrl(`/person/${personId}/movie_credits`, apiKey), {
      next: { revalidate: 21600 },
    });

    if (!res.ok) return { id: personId, cast: [], crew: [] };
    return await res.json();
  } catch (err) {
    console.error("Error fetching credits:", err);
    return { id: personId, cast: [], crew: [] };
  }
}

/**
 * Fetch detailed release dates for a movie
 */
export async function getMovieReleaseDates(movieId: number, customApiKey?: string): Promise<TMDBReleaseDatesResponse | null> {
  const apiKey = getResolvedApiKey(customApiKey);
  if (!apiKey) return null;

  try {
    const res = await fetch(buildUrl(`/movie/${movieId}/release_dates`, apiKey), {
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
  const { personId, roles = ["director", "actor"], types = ["theatrical", "digital"], country = "US", window = "all" } = options;
  const apiKey = getResolvedApiKey(customApiKey);

  const [person, credits] = await Promise.all([
    getPersonDetails(personId, apiKey),
    getPersonCredits(personId, apiKey),
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
      addCandidate(item, item.character ? `Actor (${item.character})` : "Actor");
    }
  }

  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => {
    const dateA = a.movie.release_date || "0000-00-00";
    const dateB = b.movie.release_date || "0000-00-00";
    return dateB.localeCompare(dateA);
  });

  const sliceCandidates = candidateList.slice(0, 25);
  const nowStr = new Date().toISOString().split("T")[0];
  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const formattedReleases: FormattedRelease[] = [];

  await Promise.all(
    sliceCandidates.map(async ({ movie, roles: movieRoles }) => {
      const releaseDatesData = await getMovieReleaseDates(movie.id, apiKey);
      let foundSpecific = false;

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

// Minimal fallback mock
const MOCK_PERSONS: TMDBPersonSearchResult[] = [
  {
    id: 525,
    name: "Christopher Nolan",
    original_name: "Christopher Nolan",
    known_for_department: "Directing",
    profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3Z5.jpg",
    popularity: 45.2,
    known_for: [{ id: 872585, title: "Oppenheimer", media_type: "movie" }],
  },
  {
    id: 137427,
    name: "Denis Villeneuve",
    original_name: "Denis Villeneuve",
    known_for_department: "Directing",
    profile_path: "/4aT1vL05c9k3U0zD6rT4TzM9qZ9.jpg",
    popularity: 38.6,
    known_for: [{ id: 693134, title: "Dune: Part Two", media_type: "movie" }],
  },
  {
    id: 234352,
    name: "Margot Robbie",
    original_name: "Margot Robbie",
    known_for_department: "Acting",
    profile_path: "/euDPyqLnuUMgYvNaT7umgp49OnE.jpg",
    popularity: 52.1,
    known_for: [{ id: 346698, title: "Barbie", media_type: "movie" }],
  },
  {
    id: 18897,
    name: "Quentin Tarantino",
    original_name: "Quentin Tarantino",
    known_for_department: "Directing",
    profile_path: "/1gjVuRg0Lq1gK0pW3kH6b.jpg",
    popularity: 35.8,
    known_for: [{ id: 680, title: "Pulp Fiction", media_type: "movie" }],
  },
];

function getMockPersons(query: string): TMDBPersonSearchResult[] {
  const q = query.toLowerCase();
  return MOCK_PERSONS.filter((p) => p.name.toLowerCase().includes(q));
}

function getMockCredits(personId: number): TMDBPersonCreditsResponse {
  return {
    id: personId,
    cast: [],
    crew: [
      {
        id: 1159311,
        title: "Upcoming Project",
        original_title: "Upcoming Project",
        overview: "Feature release scheduled for cinema and streaming.",
        poster_path: null,
        backdrop_path: null,
        release_date: "2026-07-17",
        vote_average: 0,
        job: "Director",
        department: "Directing",
      },
    ],
  };
}
