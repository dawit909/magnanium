"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  Bell,
  Trash2,
  LogOut,
  Mail,
  Loader2,
  Check,
  User,
  ChevronRight,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTimingWindow } from "@/types/tmdb";
import { getTmdbImageUrl } from "@/lib/media";
import { createPersonSlug } from "@/lib/slug";

interface MyAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyAlertsDrawer({ isOpen, onClose }: MyAlertsDrawerProps) {
  const {
    isAuthenticated,
    userEmail,
    artists,
    unfollowArtist,
    updateArtistAlert,
    sendMagicLink,
    logout,
  } = useSubscription();

  const [mounted, setMounted] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const artistList = Object.values(artists).sort((a, b) =>
    a.personName.localeCompare(b.personName)
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await sendMagicLink(emailInput.trim());
      setSuccessMessage(
        res.simulated
          ? `[Dev Mode] Verification link logged to server console for ${emailInput}.`
          : `We sent a verification link to ${emailInput}. Check your inbox!`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send verification link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {isAuthenticated ? `My Feeds (${artistList.length})` : "My Feeds"}
                </h2>
                {isAuthenticated && userEmail && (
                  <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 truncate max-w-[220px]">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isAuthenticated ? (
              artistList.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    No feeds followed yet
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Search for an actor, director, or writer and click &quot;Email Alerts&quot; to follow their upcoming releases.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {artistList.map((artist) => {
                    const slug = createPersonSlug(artist.personId, artist.personName);
                    return (
                      <div
                        key={artist.personId}
                        className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3 group"
                      >
                        <Link
                          href={`/${slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity no-underline"
                        >
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-400">
                            {artist.profilePath ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getTmdbImageUrl(artist.profilePath, "w180_and_h180_face") || ""}
                                alt={artist.personName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1">
                              <span>{artist.personName}</span>
                              <ChevronRight className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                              Added {new Date(artist.subscribedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Link>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <select
                            value={artist.alert}
                            onChange={(e) =>
                              updateArtistAlert(
                                artist.personId,
                                e.target.value as AlertTimingWindow
                              )
                            }
                            aria-label={`Alert timing for ${artist.personName}`}
                            className="text-[11px] font-medium py-1 px-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                          >
                            <option value="announced">When Announced</option>
                            <option value="when_released">When Released</option>
                            <option value="month_before">Month Before</option>
                            <option value="week_before">Week Before</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => unfollowArtist(artist.personId)}
                            title="Unfollow"
                            aria-label={`Unfollow ${artist.personName}`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="py-6 space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Sign In
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Enter your email address to receive a verification link and manage all your followed artist alerts in one place.
                  </p>
                </div>

                {successMessage ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
                    <div className="font-semibold flex items-center gap-1.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Check Your Email
                    </div>
                    <p className="leading-relaxed">{successMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-neutral-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
                      />
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Verification Link</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {isAuthenticated && (
            <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">Passwordless Account</span>
              <button
                onClick={logout}
                className="text-xs text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
