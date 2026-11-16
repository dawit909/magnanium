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
      country: string
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
    sendMagicLink,
    logout,
    refreshSession,
  };
}
