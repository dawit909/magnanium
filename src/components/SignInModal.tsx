"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Check, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { sendMagicLink } = useSubscription();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await sendMagicLink(email.trim());
      setSuccessMessage(
        res.simulated
          ? `[Dev Mode] Magic link logged to server console for ${email.trim()}.`
          : `We've sent a magic sign-in link to ${email.trim()}. Check your inbox!`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send sign-in link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl relative space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-modal-title"
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
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 id="signin-modal-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Sign In
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Passwordless login. Enter your email to receive a magic sign-in link.
            </p>
          </div>
        </div>

        {/* Content */}
        {successMessage ? (
          <div className="space-y-4 pt-1">
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
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="signin-email" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="signin-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
                />
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
                  <span>Send Magic Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
