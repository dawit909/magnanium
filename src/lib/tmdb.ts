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
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";

// Map TMDB release type integer to category
export function mapReleaseType(type: number): { category: ReleaseTypeCategory; label: string } {
  switch (type) {
    case 1:
      return { category: "premiere", label: "Premiere" };
    case 2:
      return { category: "theatrical", label: "Theatrical (Limited)" };
    case 3:
      return { category: "theatrical", label: "Theatrical" };
    case 4:
      return { category: "digital", label: "Digital / Streaming" };
    case 5:
      return { category: "physical", label: "Physical (Blu-ray / DVD)" };
    case 6:
      return { category: "other", label: "TV" };
    default:
      return { category: "other", label: "General Release" };
  }
}

// Common headers and URL builder for TMDB
function getTMDBUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  if (TMDB_API_KEY) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Search for an actor or director by name
 */
export async function searchPerson(query: string): Promise<TMDBPersonSearchResult[]> {
  if (!query.trim()) return [];

  if (!TMDB_API_KEY) {
    return getMockPersons(query);
  }

  try {
    const res = await fetch(getTMDBUrl("/search/person", { query }), {
      next: { revalidate: 3600 }, // Cache search for 1 hour
    });

    if (!res.ok) {
      console.warn(`TMDB search returned ${res.status}, falling back to mock`);
      return getMockPersons(query);
    }

    const data = await res.json();
    return (data.results || []).slice(0, 8);
  } catch (err) {
    console.error("TMDB search error:", err);
    return getMockPersons(query);
  }
}

/**
 * Get person details and biography
 */
export async function getPersonDetails(personId: number) {
  if (!TMDB_API_KEY) {
    const mock = MOCK_PERSONS.find((p) => p.id === personId) || MOCK_PERSONS[0];
    return mock;
  }

  try {
    const res = await fetch(getTMDBUrl(`/person/${personId}`), {
      next: { revalidate: 86400 }, // 24 hours
    });
    if (!res.ok) throw new Error("Failed to fetch person");
    return await res.json();
  } catch {
    return MOCK_PERSONS.find((p) => p.id === personId) || MOCK_PERSONS[0];
  }
}

/**
 * Get person movie credits (both cast and crew)
 */
export async function getPersonCredits(personId: number): Promise<TMDBPersonCreditsResponse> {
  if (!TMDB_API_KEY) {
    return getMockCredits(personId);
  }

  try {
    const res = await fetch(getTMDBUrl(`/person/${personId}/movie_credits`), {
      next: { revalidate: 21600 }, // 6 hours
    });

    if (!res.ok) throw new Error("Failed to fetch credits");
    return await res.json();
  } catch (err) {
    console.error("Error fetching credits:", err);
    return getMockCredits(personId);
  }
}

/**
 * Fetch detailed release dates for a specific movie
 */
export async function getMovieReleaseDates(movieId: number): Promise<TMDBReleaseDatesResponse | null> {
  if (!TMDB_API_KEY) {
    return null;
  }

  try {
    const res = await fetch(getTMDBUrl(`/movie/${movieId}/release_dates`), {
      next: { revalidate: 43200 }, // 12 hours
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Main function: Given a person and filter options, compiles a list of formatted movie releases
 */
export async function getPersonReleases(options: FeedFilterOptions): Promise<{
  personName: string;
  releases: FormattedRelease[];
}> {
  const { personId, roles = ["director", "actor"], types = ["theatrical", "digital"], country = "US", window = "all" } = options;

  const [person, credits] = await Promise.all([
    getPersonDetails(personId),
    getPersonCredits(personId),
  ]);

  const personName = person.name || "Artist";

  // Filter movies by role
  const candidateMap = new Map<number, { movie: TMDBCreditItem; roles: string[] }>();

  // Helper to add candidate
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
      addCandidate(item, item.character ? `Actor (as ${item.character})` : "Actor");
    }
  }

  const candidateList = Array.from(candidateMap.values());

  // Sort descending by release_date
  candidateList.sort((a, b) => {
    const dateA = a.movie.release_date || "0000-00-00";
    const dateB = b.movie.release_date || "0000-00-00";
    return dateB.localeCompare(dateA);
  });

  // Limit to most recent and upcoming 25 movies to avoid hitting API rate limits during release date fetching
  const sliceCandidates = candidateList.slice(0, 25);

  const nowStr = new Date().toISOString().split("T")[0];
  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const formattedReleases: FormattedRelease[] = [];

  // Fetch release dates for candidates in parallel batches
  await Promise.all(
    sliceCandidates.map(async ({ movie, roles: movieRoles }) => {
      const releaseDatesData = await getMovieReleaseDates(movie.id);

      let foundSpecificReleases = false;

      if (releaseDatesData && releaseDatesData.results) {
        // Look for the requested country first, fallback to US, then fallback to first available
        const countryData =
          releaseDatesData.results.find((r) => r.iso_3166_1.toUpperCase() === country.toUpperCase()) ||
          releaseDatesData.results.find((r) => r.iso_3166_1 === "US") ||
          releaseDatesData.results[0];

        if (countryData && countryData.release_dates) {
          for (const rd of countryData.release_dates) {
            const dateStr = rd.release_date ? rd.release_date.split("T")[0] : "";
            if (!dateStr) continue;

            const { category, label } = mapReleaseType(rd.type);

            // Filter by type
            if (!types.includes(category)) continue;

            // Filter by window
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
            foundSpecificReleases = true;
          }
        }
      }

      // If no release dates endpoint or mock mode, fall back to general movie.release_date
      if (!foundSpecificReleases && movie.release_date) {
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
          releaseTypeLabel: "General Release",
          country: country,
          role: movieRoles.join(", "),
          tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
        });
      }
    })
  );

  // Sort releases by release date ascending (soonest first) or descending
  formattedReleases.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return {
    personName,
    releases: formattedReleases,
  };
}

// --------------------------------------------------------------------------------
// Mock Data (Used if user hasn't added TMDB_API_KEY yet)
// --------------------------------------------------------------------------------
const MOCK_PERSONS: TMDBPersonSearchResult[] = [
  {
    id: 525,
    name: "Christopher Nolan",
    original_name: "Christopher Nolan",
    known_for_department: "Directing",
    profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3Z5.jpg",
    popularity: 45.2,
    known_for: [
      { id: 872585, title: "Oppenheimer", media_type: "movie", release_date: "2023-07-21" },
      { id: 157336, title: "Interstellar", media_type: "movie", release_date: "2014-11-05" },
      { id: 27205, title: "Inception", media_type: "movie", release_date: "2010-07-16" },
    ],
  },
  {
    id: 137427,
    name: "Denis Villeneuve",
    original_name: "Denis Villeneuve",
    known_for_department: "Directing",
    profile_path: "/4aT1vL05c9k3U0zD6rT4TzM9qZ9.jpg",
    popularity: 38.6,
    known_for: [
      { id: 693134, title: "Dune: Part Two", media_type: "movie", release_date: "2024-03-01" },
      { id: 438631, title: "Dune", media_type: "movie", release_date: "2021-09-15" },
      { id: 335984, title: "Blade Runner 2049", media_type: "movie", release_date: "2017-10-04" },
    ],
  },
  {
    id: 234352,
    name: "Margot Robbie",
    original_name: "Margot Robbie",
    known_for_department: "Acting",
    profile_path: "/euDPyqLnuUMgYvNaT7umgp49OnE.jpg",
    popularity: 52.1,
    known_for: [
      { id: 346698, title: "Barbie", media_type: "movie", release_date: "2023-07-21" },
      { id: 466420, title: "Killers of the Flower Moon", media_type: "movie" },
    ],
  },
  {
    id: 18897,
    name: "Quentin Tarantino",
    original_name: "Quentin Tarantino",
    known_for_department: "Directing",
    profile_path: "/1gjVuRg0Lq1gK0pW3kH6b.jpg",
    popularity: 35.8,
    known_for: [
      { id: 680, title: "Pulp Fiction", media_type: "movie", release_date: "1994-09-10" },
      { id: 466272, title: "Once Upon a Time... in Hollywood", media_type: "movie", release_date: "2019-07-26" },
    ],
  },
];

function getMockPersons(query: string): TMDBPersonSearchResult[] {
  const q = query.toLowerCase();
  return MOCK_PERSONS.filter((p) => p.name.toLowerCase().includes(q));
}

function getMockCredits(personId: number): TMDBPersonCreditsResponse {
  if (personId === 525) {
    return {
      id: 525,
      cast: [],
      crew: [
        {
          id: 1159311,
          title: "The Prisoner (Upcoming Nolan Project)",
          original_title: "The Prisoner",
          overview: "Next highly anticipated epic feature project directed by Christopher Nolan.",
          poster_path: null,
          backdrop_path: null,
          release_date: "2026-07-17",
          vote_average: 0,
          job: "Director",
          department: "Directing",
        },
        {
          id: 872585,
          title: "Oppenheimer",
          original_title: "Oppenheimer",
          overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
          poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
          backdrop_path: "/rLb2cw69P71pmUDda1aAcAF3a67.jpg",
          release_date: "2023-07-21",
          vote_average: 8.1,
          job: "Director",
          department: "Directing",
        },
      ],
    };
  }

  return {
    id: personId,
    cast: [
      {
        id: 346698,
        title: "Upcoming Project",
        original_title: "Upcoming Project",
        overview: "A featured major cinema release.",
        poster_path: null,
        backdrop_path: null,
        release_date: "2026-11-20",
        vote_average: 0,
        character: "Lead",
      },
    ],
    crew: [],
  };
}
