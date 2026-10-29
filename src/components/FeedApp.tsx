"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { createPersonSlug } from "@/lib/slug";
import { useTheme } from "@/hooks/useTheme";
import { useSearch } from "@/hooks/useSearch";
import { useFeedState } from "@/hooks/useFeedState";
import { useRecentArtists } from "@/hooks/useRecentArtists";
import Header from "./Header";
import ArtistHero from "./ArtistHero";
import RecentArtists from "./RecentArtists";
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
  const { recentArtists } = useRecentArtists(selectedPerson);

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

  const {
    media,
    toggleMedia,
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
    previewReleases,
    totalUnfilteredCount,
    isLoadingPreview,
    feedUrl,
    feedProtocolUrl,
  } = useFeedState(selectedPerson);

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
    <div className="space-y-8 text-sm">
      <Header
        onHomeClick={goHome}
        theme={theme}
        onToggleTheme={toggleTheme}
        query={query}
        onQueryChange={setQuery}
        searchResults={searchResults}
        activeIndex={activeIndex}
        onSetActiveIndex={setActiveIndex}
        onSelectPerson={handleSelectPerson}
        isSearching={isSearching}
        hasSearched={hasSearched}
        isOpen={isOpen}
        onFocus={handleFocus}
        searchContainerRef={searchContainerRef}
        searchInputRef={searchInputRef}
        onKeyDown={handleKeyDown}
      />

      {!selectedPerson ? (
        <div className="pt-2 space-y-6">
          <RecentArtists
            artists={recentArtists}
            onSelect={(slug) => router.push(`/${slug}`)}
          />
          <SampleFeedPreview onSelectSampleArtist={handleSelectPerson} />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ArtistHero person={selectedPerson} />

          <FeedFilters
            media={media}
            onToggleMedia={toggleMedia}
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
          />

          <FeedUrlCard
            feedUrl={feedUrl}
            feedProtocolUrl={feedProtocolUrl}
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
