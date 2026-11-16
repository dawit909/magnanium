"use client";

import { useState, useEffect } from "react";
import { Mail, Check, Loader2, X, Bell } from "lucide-react";
import { AlertTimingWindow, TMDBPersonSearchResult } from "@/types/tmdb";
import { useSubscription } from "@/hooks/useSubscription";

interface EmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: TMDBPersonSearchResult;
  currentAlert: AlertTimingWindow;
  currentCountry: string;
}

export default function EmailAlertModal({
  isOpen,
  onClose,
  person,
  currentAlert,
  currentCountry,
}: EmailAlertModalProps) {
  const {
    isAuthenticated,
    userEmail,
    isFollowing,
    getArtistSub,
    followArtist,
    unfollowArtist,
    updateArtistAlert,
    sendMagicLink,
  } = useSubscription();

  const following = isFollowing(person.id);
  const existingSub = getArtistSub(person.id);

  const [email, setEmail] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<AlertTimingWindow>(
    existingSub?.alert || currentAlert || "announced"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingSub) {
      setSelectedAlert(existingSub.alert);
    } else {
      setSelectedAlert(currentAlert || "announced");
    }
  }, [existingSub, currentAlert]);

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

  if (!isOpen) return null;

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
        alert: selectedAlert,
        country: currentCountry,
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
        selectedAlert,
        currentCountry
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

  const handleUpdateAlert = async (newAlert: AlertTimingWindow) => {
    setSelectedAlert(newAlert);
    if (following) {
      setIsSubmitting(true);
      await updateArtistAlert(person.id, newAlert);
      setIsSubmitting(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl relative space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
              {following ? `Alerts for ${person.name}` : `Email Alerts for ${person.name}`}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Get notified directly in your inbox when new releases are announced or scheduled.
            </p>
          </div>
        </div>

        {/* Alert Timing Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Notify me:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "announced", label: "When Announced" },
              { id: "when_released", label: "When Released" },
              { id: "month_before", label: "Month Before" },
              { id: "week_before", label: "Week Before" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleUpdateAlert(opt.id as AlertTimingWindow)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  selectedAlert === opt.id
                    ? "border-amber-500/80 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                    : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content depending on Auth & Following state */}
        {isAuthenticated ? (
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 px-3.5 py-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
              <span>Sending alerts to:</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                {userEmail}
              </span>
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
                    className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors cursor-pointer"
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
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
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
          <form onSubmit={handleSendMagicLink} className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email-input" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Your Email:
              </label>
              <div className="relative">
                <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
                />
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Passwordless login. We'll send a 1-click magic link to confirm.
              </p>
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
                  <span>Send Confirmation Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
