"use client";

import { useState } from "react";
import { MovieList } from "@/components/MovieList";
import { Button } from "@/components/ui/Button";
import { useFavorites } from "@/hooks/useMovies";
import { useMovieList } from "@/hooks/useMovieList";
import Link from "next/link";

export default function FavoritesPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: searchResults, isLoading, error } = useFavorites(currentPage);

  const {
    clientError,
    isMutating,
    totalResults,
    totalPages,
    handleToggleFavorite,
    handlePageChange,
  } = useMovieList({
    searchResults,
    isLoading,
    currentPage,
    setCurrentPage,
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl text-white font-bold  bg-clip-text ">
              My Favorites
            </h1>
          </div>
          <p className="text-center text-muted-foreground">
            {totalResults} {totalResults === 1 ? "movie" : "movies"} saved
          </p>
        </div>

        {clientError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{clientError}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-xl text-red-500 mb-2">Error loading favorites</p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        )}

        {!error && isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Loading favorites...</p>
          </div>
        )}

        {!error && !isLoading && totalResults === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies to your favorites from the search page
            </p>
            <Link href="/">
              <Button className="bg-gradient-primary">
                Search Movies
              </Button>
            </Link>
          </div>
        )}

        {!error && !isLoading && totalResults > 0 && searchResults && (
          <MovieList
            isFavoritesPage
            movies={searchResults.data.favorites}
            currentPage={currentPage}
            totalPages={totalPages}
            isMutating={isMutating}
            onToggleFavorite={(movie) => handleToggleFavorite(movie, true)}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
