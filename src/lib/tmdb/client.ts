import { kv } from "../kv";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const SERVER_API_KEY = process.env.TMDB_API_KEY || "";
const SERVER_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || "";

export function getResolvedApiKey(clientKey?: string | null): string {
  return (clientKey && clientKey.trim()) || SERVER_API_KEY;
}

export function hasTmdbAuth(clientKey?: string): boolean {
  return Boolean(SERVER_ACCESS_TOKEN || getResolvedApiKey(clientKey));
}

export function buildTmdbUrl(
  endpoint: string,
  params: Record<string, string> = {},
  clientKey?: string
): string {
  const apiKey = getResolvedApiKey(clientKey);
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function getTmdbHeaders(clientKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (!clientKey && SERVER_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${SERVER_ACCESS_TOKEN}`;
  }
  return headers;
}

export async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
  revalidateSeconds: number = 3600,
  clientKey?: string
): Promise<{ data: T | null; status: number }> {
  // Use shared L1/L2 KV cache for shared server API key requests
  const isSharedRequest = !clientKey;
  const paramEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const paramKey = paramEntries.map(([k, v]) => `${k}=${v}`).join("&");
  const cacheKey = `tmdb:${endpoint}?${paramKey}`;

  if (isSharedRequest) {
    const cached = await kv.get<T>(cacheKey);
    if (cached !== null) {
      return { data: cached, status: 200 };
    }
  }

  const url = buildTmdbUrl(endpoint, params, clientKey);
  const headers = getTmdbHeaders(clientKey);

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
      return { data: null, status: res.status };
    }

    const data: T = await res.json();

    if (isSharedRequest && data) {
      // Asynchronously populate shared L1/L2 KV cache with TTL
      kv.set(cacheKey, data, revalidateSeconds).catch(() => {});
    }

    return { data, status: res.status };
  } catch (err) {
    console.error(`TMDB fetch error for ${endpoint}:`, err);
    return { data: null, status: 500 };
  }
}
