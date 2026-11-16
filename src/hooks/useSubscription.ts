"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTimingWindow } from "@/types/tmdb";
import { SubscribedArtist } from "@/lib/subscriptions";

export interface SubscriptionState {
  isAuthenticated: boolean;
  userEmail: string | null;
  artists: Record<string, SubscribedArtist>;
  isLoading: boolean;
}

let cachedState: SubscriptionState = {
  isAuthenticated: false,
  userEmail: null,
  artists: {},
  isLoading: true,
};

const listeners = new Set<(state: SubscriptionState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(cachedState));
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(cachedState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          cachedState = {
            isAuthenticated: true,
            userEmail: data.user.email,
            artists: data.user.artists || {},
            isLoading: false,
          };
          notifyListeners();
          return;
        }
      }
    } catch {}

    cachedState = {
      isAuthenticated: false,
      userEmail: null,
      artists: {},
      isLoading: false,
    };
    notifyListeners();
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    refreshSession();
  }, [refreshSession]);

  const isFollowing = useCallback(
    (personId: number) => {
      return Boolean(state.artists[String(personId)]);
    },
    [state.artists]
  );

  const getArtistSub = useCallback(
    (personId: number) => {
      return state.artists[String(personId)];
    },
    [state.artists]
  );

  const sendMagicLink = useCallback(
    async (
      email: string,
      artist?: {
        personId: number;
        personName: string;
        profilePath: string | null;
        alert: AlertTimingWindow;
        country: string;
        roles?: string[];
        types?: string[];
        excludeShorts?: boolean;
        excludeReReleases?: boolean;
        excludeUncredited?: boolean;
      }
    ) => {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, artist }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send confirmation email");
      }
      return data;
    },
    []
  );

  const followArtist = useCallback(
    async (
      person: { id: number; name: string; profile_path: string | null },
      alert: AlertTimingWindow,
      country: string,
      options?: {
        roles?: string[];
        types?: string[];
        excludeShorts?: boolean;
        excludeReReleases?: boolean;
        excludeUncredited?: boolean;
      }
    ) => {
      if (!state.isAuthenticated) return false;

      try {
        const res = await fetch("/api/subscriptions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "subscribe",
            personId: person.id,
            personName: person.name,
            profilePath: person.profile_path,
            alert,
            country,
            ...(options?.roles ? { roles: options.roles } : {}),
            ...(options?.types ? { types: options.types } : {}),
            ...(options?.excludeShorts !== undefined ? { excludeShorts: options.excludeShorts } : {}),
            ...(options?.excludeReReleases !== undefined ? { excludeReReleases: options.excludeReReleases } : {}),
            ...(options?.excludeUncredited !== undefined ? { excludeUncredited: options.excludeUncredited } : {}),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            cachedState = {
              ...cachedState,
              artists: data.user.artists || {},
            };
            notifyListeners();
            return true;
          }
        }
      } catch (err) {
        console.error("Error following artist:", err);
      }
      return false;
    },
    [state.isAuthenticated]
  );

  const unfollowArtist = useCallback(
    async (personId: number) => {
      if (!state.isAuthenticated) return false;

      try {
        const res = await fetch("/api/subscriptions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "unsubscribe",
            personId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            cachedState = {
              ...cachedState,
              artists: data.user.artists || {},
            };
            notifyListeners();
            return true;
          }
        }
      } catch (err) {
        console.error("Error unfollowing artist:", err);
      }
      return false;
    },
    [state.isAuthenticated]
  );

  const updateArtistAlert = useCallback(
    async (personId: number, alert: AlertTimingWindow) => {
      if (!state.isAuthenticated) return false;

      try {
        const res = await fetch("/api/subscriptions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_alert",
            personId,
            alert,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            cachedState = {
              ...cachedState,
              artists: data.user.artists || {},
            };
            notifyListeners();
            return true;
          }
        }
      } catch (err) {
        console.error("Error updating artist alert:", err);
      }
      return false;
    },
    [state.isAuthenticated]
  );

  const updateArtistOptions = useCallback(
    async (
      personId: number,
      options: {
        alert?: AlertTimingWindow;
        country?: string;
        roles?: string[];
        types?: string[];
        excludeShorts?: boolean;
        excludeReReleases?: boolean;
        excludeUncredited?: boolean;
      }
    ) => {
      if (!state.isAuthenticated) return false;

      // Optimistically update cachedState so the UI responds with zero delay
      if (cachedState.artists[String(personId)]) {
        cachedState = {
          ...cachedState,
          artists: {
            ...cachedState.artists,
            [String(personId)]: {
              ...cachedState.artists[String(personId)],
              ...options,
            },
          },
        };
        notifyListeners();
      }

      try {
        const res = await fetch("/api/subscriptions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_options",
            personId,
            ...options,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            cachedState = {
              ...cachedState,
              artists: data.user.artists || {},
            };
            notifyListeners();
            return true;
          }
        }
      } catch (err) {
        console.error("Error updating artist options:", err);
      }
      return false;
    },
    [state.isAuthenticated]
  );

  const sendTestAlert = useCallback(
    async (personId?: number, personName?: string) => {
      if (!state.isAuthenticated) {
        throw new Error("Please sign in first to test alerts.");
      }

      const res = await fetch("/api/test/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, personName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send test alert");
      }
      return data;
    },
    [state.isAuthenticated]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "POST" });
    } catch {}

    cachedState = {
      isAuthenticated: false,
      userEmail: null,
      artists: {},
      isLoading: false,
    };
    notifyListeners();
  }, []);

  return {
    ...state,
    isFollowing,
    getArtistSub,
    followArtist,
    unfollowArtist,
    updateArtistAlert,
    updateArtistOptions,
    sendMagicLink,
    sendTestAlert,
    logout,
    refreshSession,
  };
}
