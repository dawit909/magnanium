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

export interface TMDBPersonDetails {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path: string | null;
  known_for_department?: string;
  original_name?: string;
  popularity?: number;
  gender?: number;
  imdb_id?: string;
  homepage?: string | null;
}

export interface TMDBCreditItem {
  id: number;
  media_type?: "movie" | "tv";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  character?: string;
  department?: string;
  job?: string;
  origin_country?: string[];
  genre_ids?: number[];
  episode_count?: number;
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

export interface TvSeasonItem {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TvDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  status?: string;
  in_production?: boolean;
  origin_country?: string[];
  original_language?: string;
  spoken_languages?: Array<{ english_name?: string; name?: string; iso_639_1?: string }>;
  created_by?: { id: number; name: string }[];
  episode_run_time?: number[];
  next_episode_to_air?: {
    id: number;
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  } | null;
  seasons?: TvSeasonItem[];
}

export type ReleaseTypeCategory = "cinema" | "home" | "earliest";

export interface WatchProvidersInfo {
  link?: string;
  stream?: string[];
  rent?: string[];
  buy?: string[];
}

export interface FormattedRelease {
  id: string;
  mediaType: "movie" | "tv";
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
  watchProviders?: WatchProvidersInfo | null;
  director?: string | null;
  writer?: string | null;
  stars?: string[] | null;
  runtime?: string | null;
  language?: string | null;
}

export interface FeedFilterOptions {
  personId: number;
  media?: ("movie" | "tv")[];
  roles?: string[]; // "actor", "crew" (or "behind_the_scenes")
  types?: string[]; // "cinema", "home", "earliest"
  country?: string;
  window?: "upcoming" | "all";
  alert?: "announced" | "release_day" | "week_before";
  excludeShorts?: boolean;
  excludeReReleases?: boolean;
}
