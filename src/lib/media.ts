/**
 * TMDB Media & Image URL Abstraction Layer.
 */

export type TmdbImageSize =
  | "w92"
  | "w180_and_h180_face"
  | "w185"
  | "w300_and_h300_face"
  | "w342"
  | "w500"
  | "original";

export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

/**
 * Build a canonical TMDB image URL with the specified width/crop.
 * Returns null if path is undefined, null, or empty.
 * If path is already an absolute URL (e.g. mock or CDN), returns path untouched.
 */
export function getTmdbImageUrl(
  path?: string | null,
  size: TmdbImageSize = "w342"
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${cleanPath}`;
}

/**
 * Build a face crop image URL (e.g. for profile avatars)
 */
export function getTmdbFaceUrl(
  path?: string | null,
  size: "w180_and_h180_face" | "w300_and_h300_face" = "w180_and_h180_face"
): string | null {
  return getTmdbImageUrl(path, size);
}

/**
 * Build a poster image URL for movies or TV series
 */
export function getTmdbPosterUrl(
  path?: string | null,
  size: "w185" | "w342" | "w500" = "w185"
): string | null {
  return getTmdbImageUrl(path, size);
}
