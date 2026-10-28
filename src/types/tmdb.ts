export interface TMDBPersonSearchResult {
  id: number;
  name: string;
  original_name: string;
  known_for_department: string;
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
  character?: string;
  department?: string;
  job?: string;
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
  release_date: string;
  type: number;
}

export interface TMDBReleaseDatesResponse {
  id: number;
  results: Array<{
    iso_3166_1: string;
    release_dates: TMDBReleaseDateItem[];
  }>;
}

export type ReleaseTypeCategory = "cinema" | "home" | "earliest" | "theatrical" | "digital" | "physical" | "premiere" | "other";

export interface FormattedRelease {
  id: string;
  movieId: number;
  movieTitle: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  releaseType: ReleaseTypeCategory;
  releaseTypeLabel: string;
  country: string;
  role: string;
  tmdbUrl: string;
}

export interface FeedFilterOptions {
  personId: number;
  roles?: string[];
  types?: string[]; // "cinema", "home", "earliest"
  country?: string;
  window?: "upcoming" | "all";
  excludeShorts?: boolean;
}
