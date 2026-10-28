import { TMDBPersonSearchResult } from "@/types/tmdb";

/**
 * Compact representation of a popular artist:
 * [0: id, 1: name, 2: department, 3: profile_path, 4: popularity]
 */
export type CompactArtist = [number, string, string, string, number];

/**
 * Normalize search text by stripping accents/diacritics, lowercase,
 * and replacing special characters with whitespace.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Statically allocated Int32Array buffer (up to 63x63 chars) to make Damerau-Levenshtein zero-allocation
const DL_STATIC_BUFFER = new Int32Array(4096);

/**
 * Optimized Damerau-Levenshtein distance algorithm.
 * Accounts for insertions, deletions, substitutions, and adjacent transpositions.
 * Uses a flat reusable typed buffer to avoid GC churn during tight fuzzy search loops.
 */
export function damerauLevenshtein(source: string, target: string): number {
  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const m = s.length;
  const n = t.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Single-letter fast path
  if (m === 1 && n === 1) return s === t ? 0 : 1;

  // Flat distance matrix indexed by (i * stride + j)
  const stride = n + 1;
  const totalCells = (m + 1) * stride;
  const d = totalCells <= 4096 ? DL_STATIC_BUFFER : new Int32Array(totalCells);

  for (let i = 0; i <= m; i++) {
    d[i * stride] = i;
  }
  for (let j = 0; j <= n; j++) {
    d[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    const sChar = s.charCodeAt(i - 1);
    const rowOffset = i * stride;
    const prevRowOffset = (i - 1) * stride;

    for (let j = 1; j <= n; j++) {
      const tChar = t.charCodeAt(j - 1);
      const cost = sChar === tChar ? 0 : 1;

      let minCost = Math.min(
        d[prevRowOffset + j] + 1,       // deletion
        d[rowOffset + j - 1] + 1,       // insertion
        d[prevRowOffset + j - 1] + cost // substitution
      );

      // Transposition check
      if (
        i > 1 &&
        j > 1 &&
        sChar === t.charCodeAt(j - 2) &&
        s.charCodeAt(i - 2) === tChar
      ) {
        const prevPrevRowOffset = (i - 2) * stride;
        const transCost = d[prevPrevRowOffset + j - 2] + cost;
        if (transCost < minCost) {
          minCost = transCost;
        }
      }

      d[rowOffset + j] = minCost;
    }
  }

  return d[m * stride + n];
}

/**
 * Compute the effective distance between a search query and a candidate name.
 * Handles exact prefix matches, single-token queries, and multi-token queries.
 */
export function computeCandidateDistance(queryNorm: string, candidateNorm: string): number {
  if (candidateNorm === queryNorm) return 0;
  if (candidateNorm.startsWith(queryNorm)) return 0.2;

  const fullDist = damerauLevenshtein(queryNorm, candidateNorm);
  const qTokens = queryNorm.split(" ").filter((t) => t.length > 0);
  const cTokens = candidateNorm.split(" ").filter((t) => t.length > 0);

  // Single-word query (e.g. "dunst", "tarentino", "spielbrg")
  if (qTokens.length === 1) {
    const q = qTokens[0];
    let minTokenDist = fullDist;
    for (const ct of cTokens) {
      if (ct === q) return 0;
      if (ct.startsWith(q)) return 0.3;
      const d = damerauLevenshtein(q, ct);
      if (d < minTokenDist) minTokenDist = d;
    }
    return minTokenDist;
  }

  // Multi-word query (e.g. "zacj snyder", "kristen dunst")
  let tokenSum = 0;
  for (const qt of qTokens) {
    let bestDist = 99;
    for (const ct of cTokens) {
      if (ct === qt) {
        bestDist = 0;
        break;
      }
      if (ct.startsWith(qt)) {
        bestDist = Math.min(bestDist, 0.3);
      }
      const d = damerauLevenshtein(qt, ct);
      if (d < bestDist) bestDist = d;
    }
    tokenSum += bestDist;
  }

  return Math.min(fullDist, tokenSum);
}

/**
 * Damerau-Levenshtein Scoring + Popularity Boost:
 * Score = LevenshteinDistance(query, candidate) - min(Popularity / 5, 2)
 * Lower score is better.
 */
export function scoreCandidate(
  queryNorm: string,
  candidateName: string,
  popularity: number = 0,
  isTopArtist = false
): { dist: number; score: number } {
  const candidateNorm = normalizeSearchText(candidateName);
  const dist = computeCandidateDistance(queryNorm, candidateNorm);
  const popBonus = Math.min(popularity / 5, 2) + (isTopArtist ? 1.0 : 0);
  const score = dist - popBonus;
  return { dist, score };
}

/**
 * In-memory fuzzy search index over top TMDB artists.
 * Uses inverted token and prefix lookups for < 2ms search performance.
 */
export class TopArtistsFuzzyIndex {
  private artists: CompactArtist[] = [];
  private artistIdSet = new Set<number>();
  private tokenMap = new Map<string, number[]>();
  private prefixMap = new Map<string, number[]>();
  private tokensByLength = new Map<number, string[]>();

  constructor(artists: CompactArtist[]) {
    this.artists = artists;
    this.buildIndex();
  }

  public hasArtist(id: number): boolean {
    return this.artistIdSet.has(id);
  }

  private buildIndex() {
    for (let i = 0; i < this.artists.length; i++) {
      this.artistIdSet.add(this.artists[i][0]);
      const nameNorm = normalizeSearchText(this.artists[i][1]);
      const tokens = nameNorm.split(" ").filter((t) => t.length >= 2);

      for (const t of tokens) {
        // Token map
        let tokenList = this.tokenMap.get(t);
        if (!tokenList) {
          tokenList = [];
          this.tokenMap.set(t, tokenList);
          const len = t.length;
          let lenList = this.tokensByLength.get(len);
          if (!lenList) {
            lenList = [];
            this.tokensByLength.set(len, lenList);
          }
          lenList.push(t);
        }
        tokenList.push(i);

        // 3-character prefix map
        const pref = t.slice(0, 3);
        let prefList = this.prefixMap.get(pref);
        if (!prefList) {
          prefList = [];
          this.prefixMap.set(pref, prefList);
        }
        prefList.push(i);
      }
    }
  }

  /**
   * Search artists by query with typo tolerance and popularity ranking.
   * Runs in < 2ms.
   */
  public search(query: string, limit = 6): TMDBPersonSearchResult[] {
    const queryNorm = normalizeSearchText(query);
    if (queryNorm.length < 2) return [];

    const queryTokens = queryNorm.split(" ").filter((t) => t.length >= 2);
    const candidateIndices = new Set<number>();

    // 1. Fast exact token and prefix match
    for (const t of queryTokens) {
      const exactMatches = this.tokenMap.get(t);
      if (exactMatches) {
        for (let i = 0; i < exactMatches.length; i++) {
          candidateIndices.add(exactMatches[i]);
        }
      }

      if (t.length >= 3) {
        const prefMatches = this.prefixMap.get(t.slice(0, 3));
        if (prefMatches) {
          for (let i = 0; i < prefMatches.length; i++) {
            candidateIndices.add(prefMatches[i]);
          }
        }
      }
    }

    // 2. If candidates are sparse, perform bounded 1-edit distance token scan
    if (candidateIndices.size < 40) {
      for (const t of queryTokens) {
        const tLen = t.length;
        // Check tokens with length within +/- 1
        for (let l = Math.max(2, tLen - 1); l <= tLen + 1; l++) {
          const tokensOfLen = this.tokensByLength.get(l);
          if (!tokensOfLen) continue;

          for (let k = 0; k < tokensOfLen.length; k++) {
            const indexedToken = tokensOfLen[k];
            if (damerauLevenshtein(t, indexedToken) <= 1) {
              const matchedIndices = this.tokenMap.get(indexedToken);
              if (matchedIndices) {
                for (let m = 0; m < matchedIndices.length; m++) {
                  candidateIndices.add(matchedIndices[m]);
                }
              }
            }
          }
        }
      }
    }

    // 3. Score and rank candidates
    const scored: Array<{
      item: TMDBPersonSearchResult;
      score: number;
      dist: number;
    }> = [];

    for (const idx of candidateIndices) {
      const [id, name, dept, profile_path, popularity] = this.artists[idx];
      const { dist, score } = scoreCandidate(queryNorm, name, popularity, true);

      // Only include candidates that are reasonably close
      if (dist <= 3.5 || score <= 2.0) {
        scored.push({
          item: {
            id,
            name,
            original_name: name,
            known_for_department: dept,
            profile_path: profile_path || null,
            popularity,
          },
          dist,
          score,
        });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, limit).map((s) => s.item);
  }
}

// Global cached instance
let globalIndexPromise: Promise<TopArtistsFuzzyIndex | null> | null = null;

/**
 * Load and cache the top artists fuzzy index (client or server).
 */
export function getPopularArtistsIndex(): Promise<TopArtistsFuzzyIndex | null> {
  if (globalIndexPromise) return globalIndexPromise;

  globalIndexPromise = (async () => {
    try {
      let artistsData: CompactArtist[];

      if (typeof window !== "undefined") {
        // Client-side fetch
        const res = await fetch("/data/popular-artists.json");
        if (!res.ok) return null;
        artistsData = await res.json();
      } else {
        // Server-side filesystem read
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public/data/popular-artists.json");
        const raw = await fs.readFile(filePath, "utf8");
        artistsData = JSON.parse(raw);
      }

      return new TopArtistsFuzzyIndex(artistsData);
    } catch (err) {
      console.warn("Failed to load popular artists fuzzy index:", err);
      return null;
    }
  })();

  return globalIndexPromise;
}
