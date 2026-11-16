"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { createPersonSlug } from "@/lib/slug";
import { useTheme } from "@/hooks/useTheme";
import { useSearch } from "@/hooks/useSearch";
import { useFeedState } from "@/hooks/useFeedState";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import Header from "./Header";
import ArtistHero from "./ArtistHero";
import FeedFilters from "./FeedFilters";
import FeedUrlCard from "./FeedUrlCard";
import ReleaseList from "./ReleaseList";
import SampleFeedPreview from "./SampleFeedPreview";

export default function FeedApp({
  initialPerson = null,
}: {
  initialPerson?: TMDBPersonSearchResult | null;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [selectedPerson, setSelectedPerson] = useState<TMDBPersonSearchResult | null>(initialPerson);

  const handleSelectPerson = useCallback(
    (person: TMDBPersonSearchResult) => {
      const slug = createPersonSlug(person.id, person.name);
      router.push(`/${slug}`);
    },
    [router]
  );

  const {
    query,
    setQuery,
    searchResults,
    activeIndex,
    setActiveIndex,
    isSearching,
    hasSearched,
    isOpen,
    handleFocus,
    searchContainerRef,
    searchInputRef,
    resetSearch,
    handleKeyDown,
  } = useSearch(handleSelectPerson);

  const handleSelectPersonFromHeader = useCallback(
    (person: TMDBPersonSearchResult) => {
      resetSearch();
      handleSelectPerson(person);
    },
    [resetSearch, handleSelectPerson]
  );

  const {
    roles,
    toggleRole,
    types,
    toggleType,
    country,
    setCountry,
    alert,
    setAlert,
    excludeShorts,
    setExcludeShorts,
    excludeReReleases,
    setExcludeReReleases,
    excludeUncredited,
    setExcludeUncredited,
    resetOptions,
    isCustomized,
    previewReleases,
    totalUnfilteredCount,
    isLoadingPreview,
    feedUrl,
    feedProtocolUrl,
  } = useFeedState(selectedPerson);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Detect alert / auth query parameters on arrival
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("alert_subscribed") === "true") {
      setNotification({
        type: "success",
        message: "Email alerts activated! You'll receive updates when new releases are announced or scheduled.",
      });
      params.delete("alert_subscribed");
      const newQuery = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newQuery ? `?${newQuery}` : ""));
    } else if (params.get("auth_success") === "true") {
      setNotification({
        type: "success",
        message: "Successfully signed in with magic link!",
      });
      params.delete("auth_success");
      const newQuery = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newQuery ? `?${newQuery}` : ""));
    } else if (params.get("auth_error")) {
      const err = params.get("auth_error");
      setNotification({
        type: "error",
        message:
          err === "expired_token"
            ? "Sign-in link has expired. Please request a new one."
            : "Sign-in link was invalid. Please try again.",
      });
      params.delete("auth_error");
      const newQuery = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newQuery ? `?${newQuery}` : ""));
    }
  }, []);

  // Sync state whenever initialPerson changes (navigation)
  useEffect(() => {
    setSelectedPerson(initialPerson);
    resetSearch();
  }, [initialPerson, resetSearch]);

  const goHome = useCallback(() => {
    resetSearch();
    router.push("/");
  }, [router, resetSearch]);

  return (
    <div className="text-sm">
      <Header
        onHomeClick={goHome}
        theme={theme}
        onToggleTheme={toggleTheme}
        query={query}
        onQueryChange={setQuery}
        searchResults={searchResults}
        activeIndex={activeIndex}
        onSetActiveIndex={setActiveIndex}
        onSelectPerson={handleSelectPersonFromHeader}
        isSearching={isSearching}
        hasSearched={hasSearched}
        isOpen={isOpen}
        onFocus={handleFocus}
        searchContainerRef={searchContainerRef}
        searchInputRef={searchInputRef}
        onKeyDown={handleKeyDown}
      />

      {notification && (
        <div
          className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:opacity-75 transition-opacity cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!selectedPerson ? (
        <div className="mt-6 space-y-6">
          <SampleFeedPreview onSelectSampleArtist={handleSelectPerson} />
        </div>
      ) : (
        <div className="mt-8 space-y-6 animate-in fade-in duration-200">
          <ArtistHero key={selectedPerson.id} person={selectedPerson} />

          <FeedUrlCard
            feedUrl={feedUrl}
            feedProtocolUrl={feedProtocolUrl}
            person={selectedPerson}
            alert={alert}
            country={country}
          />

          <FeedFilters
            roles={roles}
            onToggleRole={toggleRole}
            types={types}
            onToggleType={toggleType}
            alert={alert}
            onSetAlert={setAlert}
            country={country}
            onSetCountry={setCountry}
            excludeShorts={excludeShorts}
            onSetExcludeShorts={setExcludeShorts}
            excludeReReleases={excludeReReleases}
            onSetExcludeReReleases={setExcludeReReleases}
            excludeUncredited={excludeUncredited}
            onSetExcludeUncredited={setExcludeUncredited}
            isCustomized={isCustomized}
            onResetOptions={resetOptions}
          />

          <ReleaseList
            releases={previewReleases}
            totalCount={totalUnfilteredCount}
            isLoading={isLoadingPreview}
          />
        </div>
      )}
    </div>
  );
}
