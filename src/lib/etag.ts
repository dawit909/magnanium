import { createHash } from "crypto";

/**
 * Generate a weak ETag based on string payload (SHA-1 prefix)
 */
export function generateEtag(content: string): string {
  const hash = createHash("sha1").update(content).digest("hex").slice(0, 16);
  return `W/"${hash}"`;
}

/**
 * Check if client If-None-Match header matches generated ETag
 */
export function isEtagMatch(ifNoneMatchHeader: string | null, etag: string): boolean {
  if (!ifNoneMatchHeader) return false;
  const clientEtags = ifNoneMatchHeader.split(",").map((s) => s.trim());
  return clientEtags.includes(etag) || clientEtags.includes("*");
}
