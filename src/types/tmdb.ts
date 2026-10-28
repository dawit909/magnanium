export interface TMDBPersonSearchResult {
  id: number;
  name: string;
  original_name: string;
  known_for_department: string; // e.g. "Directing", "Acting", "Writing"
  profile_path: string | null;
  popularity: number;
  known_for?: Array<{
    id: number;
    title?: string;
    name?: string;
    media_type: string;
    release_date?: string;
  }>;
}

export interface TMDBCreditItem {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  character?: string; // If acting
  department?: string; // If crew (e.g. "Directing", "Writing")
  job?: string; // If crew (e.g. "Director", "Screenplay")
}

export interface TMDBPersonCreditsResponse {
  id: number;
  cast: TMDBCreditItem[];
  crew: TMDBCreditItem[];
}

export interface TMDBReleaseDateItem {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: string; // ISO string e.g. "2024-11-22T00:00:00.000Z"
  type: number; // 1: Premiere, 2: Theatrical (limited), 3: Theatrical, 4: Digital, 5: Physical, 6: TV
}

export interface TMDBReleaseDatesResponse {
  id: number;
  results: Array<{
    iso_3166_1: string; // e.g. "US", "GB", "KR"
    release_dates: TMDBReleaseDateItem[];
  }>;
}

export type ReleaseTypeCategory = "theatrical" | "digital" | "physical" | "premiere" | "other";

export interface FormattedRelease {
  id: string; // Unique GUID for RSS
  movieId: number;
  movieTitle: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string; // YYYY-MM-DD
  releaseType: ReleaseTypeCategory;
  releaseTypeLabel: string;
  country: string;
  role: string; // e.g. "Director", "Actor (as Bruce Wayne)"
  tmdbUrl: string;
}

export interface FeedFilterOptions {
  personId: number;
  roles?: string[]; // "director", "actor", "writer", "producer", "all"
  types?: ReleaseTypeCategory[]; // ["theatrical", "digital", "physical"]
  country?: string; // "US", "GB", etc.
  window?: "upcoming" | "all"; // "upcoming" = today onward, "all" = past year + upcoming
}
