import crypto from "crypto";
import { kv } from "./kv";
import { AlertTimingWindow, DigestFrequency } from "@/types/tmdb";
import { AUTH_CONFIG } from "./constants";

export interface SubscribedArtist {
  personId: number;
  personName: string;
  profilePath: string | null;
  alert: AlertTimingWindow;
  frequency?: DigestFrequency;
  country: string;
  subscribedAt: number;
  lastDigestSentAt?: number;
  roles?: string[];
  types?: string[];
  excludeShorts?: boolean;
  excludeReReleases?: boolean;
  excludeUncredited?: boolean;
}

export interface EmailUser {
  email: string;
  verified: boolean;
  createdAt: number;
  artists: Record<string, SubscribedArtist>; // Keyed by personId string
}

export interface MagicTokenPayload {
  email: string;
  artist?: {
    personId: number;
    personName: string;
    profilePath: string | null;
    alert: AlertTimingWindow;
    frequency?: DigestFrequency;
    country: string;
    roles?: string[];
    types?: string[];
    excludeShorts?: boolean;
    excludeReReleases?: boolean;
    excludeUncredited?: boolean;
  };
  expiresAt: number;
}

export interface SessionPayload {
  email: string;
  expiresAt: number;
}

const MAGIC_TOKEN_TTL_SECONDS = AUTH_CONFIG.MAGIC_TOKEN_TTL_SECONDS;
const SESSION_TTL_SECONDS = AUTH_CONFIG.SESSION_TTL_SECONDS;
const SIGNING_SECRET = process.env.CRON_SECRET || process.env.UPSTASH_REDIS_REST_TOKEN || "magnanium-default-secret-salt";

export function normalizeEmail(email?: string | null): string {
  return email ? email.trim().toLowerCase() : "";
}

/**
 * Generate a cryptographically secure random token (hex string).
 */
export function generateSecureToken(bytes: number = 24): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Key generators for Upstash Redis
 */
export const SUB_KEYS = {
  user: (email: string) => `sub:user:${normalizeEmail(email)}`,
  magicToken: (token: string) => `sub:magic:${token}`,
  session: (token: string) => `sub:session:${token}`,
  artistSubscribers: (personId: number) => `sub:artist:${personId}:subscribers`,
  allArtists: "sub:all_artists",
  alertSent: (email: string, releaseId: string, alert: string) =>
    `sub:sent:${normalizeEmail(email)}:${releaseId}:${alert}`,
  digestSent: (frequency: string, email: string, personId: number) =>
    `sub:digest:${frequency}:${normalizeEmail(email)}:${personId}`,
};

/**
 * Safely removes a subscriber from an artist's reverse index and updates the global tracked list.
 */
async function removeSubscriberFromArtistIndex(
  personId: number,
  normalizedEmail: string
): Promise<void> {
  const artistSubscribersKey = SUB_KEYS.artistSubscribers(personId);
  const existingSubscribers = (await kv.get<string[]>(artistSubscribersKey)) || [];
  const updatedSubscribers = existingSubscribers.filter((e) => e !== normalizedEmail);

  if (updatedSubscribers.length > 0) {
    await kv.set(artistSubscribersKey, updatedSubscribers, 0);
  } else {
    await kv.del(artistSubscribersKey);

    // Remove from global tracked artist IDs list if no subscribers remain
    const allArtists = (await kv.get<number[]>(SUB_KEYS.allArtists)) || [];
    const updatedAllArtists = allArtists.filter((id) => id !== personId);
    await kv.set(SUB_KEYS.allArtists, updatedAllArtists, 0);
  }
}

/**
 * Create a magic link token for email confirmation / login.
 */
export async function createMagicToken(
  email: string,
  artist?: MagicTokenPayload["artist"]
): Promise<string> {
  const token = generateSecureToken(32);
  const normalized = normalizeEmail(email);
  const payload: MagicTokenPayload = {
    email: normalized,
    artist,
    expiresAt: Date.now() + MAGIC_TOKEN_TTL_SECONDS * 1000,
  };

  await kv.set(SUB_KEYS.magicToken(token), payload, MAGIC_TOKEN_TTL_SECONDS);
  return token;
}

/**
 * Verify and consume a magic link token.
 */
export async function verifyAndConsumeMagicToken(
  token: string
): Promise<MagicTokenPayload | null> {
  const key = SUB_KEYS.magicToken(token);
  const payload = await kv.get<MagicTokenPayload>(key);
  if (!payload) return null;

  if (Date.now() > payload.expiresAt) {
    await kv.del(key);
    return null;
  }

  // Single-use token: consume immediately
  await kv.del(key);
  return payload;
}

/**
 * Fetch a user's subscription profile.
 */
export async function getUser(email: string): Promise<EmailUser | null> {
  const key = SUB_KEYS.user(email);
  return kv.get<EmailUser>(key);
}

/**
 * Save user subscription profile.
 */
export async function saveUser(user: EmailUser): Promise<void> {
  const key = SUB_KEYS.user(user.email);
  // Persist permanently (0 TTL)
  await kv.set(key, user, 0);
}

/**
 * Create a new 30-day session token.
 */
export async function createSession(email: string): Promise<string> {
  const token = generateSecureToken(32);
  const normalized = normalizeEmail(email);
  const payload: SessionPayload = {
    email: normalized,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  await kv.set(SUB_KEYS.session(token), payload, SESSION_TTL_SECONDS);
  return token;
}

/**
 * Validate an active session.
 */
export async function getSession(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  const payload = await kv.get<SessionPayload>(SUB_KEYS.session(token));
  if (!payload) return null;

  if (Date.now() > payload.expiresAt) {
    await kv.del(SUB_KEYS.session(token));
    return null;
  }

  return payload;
}

/**
 * Invalidate a session (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  await kv.del(SUB_KEYS.session(token));
}

/**
 * Add or update an artist subscription for a user.
 */
export async function subscribeArtist(
  email: string,
  artist: {
    personId: number;
    personName: string;
    profilePath: string | null;
    alert: AlertTimingWindow;
    frequency?: DigestFrequency;
    country: string;
    roles?: string[];
    types?: string[];
    excludeShorts?: boolean;
    excludeReReleases?: boolean;
    excludeUncredited?: boolean;
  }
): Promise<EmailUser> {
  const normalized = normalizeEmail(email);
  let user = await getUser(normalized);

  if (!user) {
    user = {
      email: normalized,
      verified: true,
      createdAt: Date.now(),
      artists: {},
    };
  }

  user.artists[String(artist.personId)] = {
    personId: artist.personId,
    personName: artist.personName,
    profilePath: artist.profilePath,
    alert: artist.alert,
    frequency: artist.frequency || "instant",
    country: artist.country,
    subscribedAt: Date.now(),
    ...(artist.roles ? { roles: artist.roles } : {}),
    ...(artist.types ? { types: artist.types } : {}),
    ...(artist.excludeShorts !== undefined ? { excludeShorts: artist.excludeShorts } : {}),
    ...(artist.excludeReReleases !== undefined ? { excludeReReleases: artist.excludeReReleases } : {}),
    ...(artist.excludeUncredited !== undefined ? { excludeUncredited: artist.excludeUncredited } : {}),
  };

  await saveUser(user);

  // Update reverse index: artist -> subscriber emails
  const artistSubscribersKey = SUB_KEYS.artistSubscribers(artist.personId);
  const existingSubscribers = (await kv.get<string[]>(artistSubscribersKey)) || [];
  if (!existingSubscribers.includes(normalized)) {
    existingSubscribers.push(normalized);
    await kv.set(artistSubscribersKey, existingSubscribers, 0);
  }

  // Update global tracked artist IDs list
  const allArtists = (await kv.get<number[]>(SUB_KEYS.allArtists)) || [];
  if (!allArtists.includes(artist.personId)) {
    allArtists.push(artist.personId);
    await kv.set(SUB_KEYS.allArtists, allArtists, 0);
  }

  return user;
}

/**
 * Remove an artist subscription for a user.
 */
export async function unsubscribeArtist(
  email: string,
  personId: number
): Promise<EmailUser | null> {
  const normalized = normalizeEmail(email);
  const user = await getUser(normalized);
  if (!user) return null;

  delete user.artists[String(personId)];
  await saveUser(user);

  // Update reverse index and global tracked list
  await removeSubscriberFromArtistIndex(personId, normalized);

  return user;
}

/**
 * Update alert timing or country for an existing subscription.
 */
export async function updateArtistSubscription(
  email: string,
  personId: number,
  updates: {
    alert?: AlertTimingWindow;
    frequency?: DigestFrequency;
    country?: string;
    roles?: string[];
    types?: string[];
    excludeShorts?: boolean;
    excludeReReleases?: boolean;
    excludeUncredited?: boolean;
    lastDigestSentAt?: number;
  }
): Promise<EmailUser | null> {
  const normalized = normalizeEmail(email);
  const user = await getUser(normalized);
  if (!user || !user.artists[String(personId)]) return null;

  const current = user.artists[String(personId)];
  user.artists[String(personId)] = {
    ...current,
    ...(updates.alert !== undefined ? { alert: updates.alert } : {}),
    ...(updates.frequency !== undefined ? { frequency: updates.frequency } : {}),
    ...(updates.country !== undefined ? { country: updates.country } : {}),
    ...(updates.roles !== undefined ? { roles: updates.roles } : {}),
    ...(updates.types !== undefined ? { types: updates.types } : {}),
    ...(updates.excludeShorts !== undefined ? { excludeShorts: updates.excludeShorts } : {}),
    ...(updates.excludeReReleases !== undefined ? { excludeReReleases: updates.excludeReReleases } : {}),
    ...(updates.excludeUncredited !== undefined ? { excludeUncredited: updates.excludeUncredited } : {}),
    ...(updates.lastDigestSentAt !== undefined ? { lastDigestSentAt: updates.lastDigestSentAt } : {}),
  };

  await saveUser(user);
  return user;
}

/**
 * Permanently delete a user account and all associated subscriptions and index references.
 */
export async function deleteUserAccount(
  email: string,
  sessionToken?: string
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const user = await getUser(normalized);

  if (user && user.artists) {
    const artistIds = Object.keys(user.artists).map(Number);
    for (const personId of artistIds) {
      await removeSubscriberFromArtistIndex(personId, normalized);
    }
  }

  // Delete user profile from KV
  await kv.del(SUB_KEYS.user(normalized));

  // Invalidate session if provided
  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  return true;
}

/**
 * Get all subscriber emails for a specific artist.
 */
export async function getArtistSubscribers(personId: number): Promise<string[]> {
  const key = SUB_KEYS.artistSubscribers(personId);
  return (await kv.get<string[]>(key)) || [];
}

/**
 * Get all artist IDs currently tracked across all subscribers.
 */
export async function getAllSubscribedArtistIds(): Promise<number[]> {
  return (await kv.get<number[]>(SUB_KEYS.allArtists)) || [];
}

/**
 * Create a secure HMAC signature for 1-click unsubscribe links in emails.
 */
export function createUnsubscribeToken(email: string, personId: number): string {
  const normalized = normalizeEmail(email);
  const data = `${normalized}:${personId}`;
  const hmac = crypto.createHmac("sha256", SIGNING_SECRET).update(data).digest("hex").slice(0, 32);
  const payload = Buffer.from(JSON.stringify({ e: normalized, p: personId, s: hmac })).toString("base64url");
  return payload;
}

/**
 * Verify a 1-click unsubscribe token.
 */
export function verifyUnsubscribeToken(
  token: string
): { email: string; personId: number } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.e || !parsed.p || !parsed.s) return null;

    const expectedHmac = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(`${parsed.e}:${parsed.p}`)
      .digest("hex")
      .slice(0, 32);

    if (parsed.s !== expectedHmac) return null;

    return { email: parsed.e, personId: Number(parsed.p) };
  } catch {
    return null;
  }
}
