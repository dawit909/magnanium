"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mail, Check, Loader2, X, Bell } from "lucide-react";
import { AlertTimingWindow, DigestFrequency, TMDBPersonSearchResult } from "@/types/tmdb";
import { useSubscription } from "@/hooks/useSubscription";
import { DIGEST_FREQUENCIES } from "@/lib/feed-options";

interface EmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: TMDBPersonSearchResult;
  currentAlert: AlertTimingWindow;
  currentCountry: string;
  roles?: string[];
  types?: string[];
  excludeShorts?: boolean;
  excludeReReleases?: boolean;
  excludeUncredited?: boolean;
}

const ALERT_LABELS: Record<AlertTimingWindow, string> = {
  announced: "When Announced",
  when_released: "When Released",
  month_before: "Month Before",
  week_before: "Week Before",
};

export default function EmailAlertModal({
  isOpen,
  onClose,
  person,
  currentAlert,
  currentCountry,
  roles,
  types,
  excludeShorts,
  excludeReReleases,
  excludeUncredited,
}: EmailAlertModalProps) {
  const {
    isAuthenticated,
    userEmail,
    isFollowing,
    getArtistSub,
    followArtist,
    unfollowArtist,
    updateArtistOptions,
    sendMagicLink,
  } = useSubscription();

  const following = isFollowing(person.id);
  const existingSub = getArtistSub(person.id);

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState<DigestFrequency>(
    existingSub?.frequency || "instant"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (existingSub?.frequency) {
      setSelectedFrequency(existingSub.frequency);
    }
  }, [existingSub?.frequency]);

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await sendMagicLink(email.trim(), {
        personId: person.id,
        personName: person.name,
        profilePath: person.profile_path,
        alert: currentAlert,
        frequency: selectedFrequency,
        country: currentCountry,
        roles,
        types,
        excludeShorts,
        excludeReReleases,
        excludeUncredited,
      });

      setSuccessMessage(
        res.simulated
          ? `[Dev Mode] Confirmation link logged to server console for ${email}.`
          : `We've sent a confirmation link to ${email}. Check your inbox to activate alerts!`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send confirmation link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle1ClickFollow = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const ok = await followArtist(
        { id: person.id, name: person.name, profile_path: person.profile_path },
        currentAlert,
        currentCountry,
        {
          frequency: selectedFrequency,
          roles,
          types,
          excludeShorts,
          excludeReReleases,
          excludeUncredited,
        }
      );
      if (ok) {
        onClose();
      } else {
        setErrorMessage("Failed to update subscription. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrequencyChange = async (freq: DigestFrequency) => {
    setSelectedFrequency(freq);
    if (following) {
      await updateArtistOptions(person.id, { frequency: freq });
    }
  };

  const handleUnfollow = async () => {
    setIsSubmitting(true);
    try {
      const ok = await unfollowArtist(person.id);
      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertLabel = ALERT_LABELS[currentAlert] || currentAlert;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl relative space-y-4 my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 id="email-modal-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {following ? `Follow Options` : `Follow ${person.name}`}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Follow <strong>{person.name}</strong> to receive release updates ({alertLabel}).
            </p>
          </div>
        </div>

        {/* Content depending on Auth & Following state */}
        {isAuthenticated ? (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 px-3.5 py-2.5 rounded-xl">
              <span>Sending alerts to:</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-[170px]">
                {userEmail}
              </span>
            </div>

            {/* Frequency Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Digest Frequency
                </label>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {DIGEST_FREQUENCIES.find((f) => f.value === selectedFrequency)?.description}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs">
                {DIGEST_FREQUENCIES.map((freq) => {
                  const isSelected = selectedFrequency === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => handleFrequencyChange(freq.value)}
                      className={`py-1.5 px-2 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      {freq.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
            )}

            <div className="flex gap-2">
              {following ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold shadow-sm transition-all cursor-pointer text-center"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={handleUnfollow}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Unfollow"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handle1ClickFollow}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Follow {person.name}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : successMessage ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                Check Your Inbox
              </div>
              <p className="leading-relaxed">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMagicLink} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="modal-email-input" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="modal-email-input"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
                />
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                We&apos;ll send a confirmation link to follow {person.name}.
              </p>
            </div>

            {/* Frequency Selector for New Subscribers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Digest Frequency
                </label>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {DIGEST_FREQUENCIES.find((f) => f.value === selectedFrequency)?.description}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs">
                {DIGEST_FREQUENCIES.map((freq) => {
                  const isSelected = selectedFrequency === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setSelectedFrequency(freq.value)}
                      className={`py-1.5 px-2 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      {freq.label}
                    </button>
                  );
                })}
              </div>
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
    </div>,
    document.body
  );
}
