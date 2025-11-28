'use client';

import { useState } from 'react';
import { useSearchMovies } from '@/hooks/useMovies';
import { useMovieList } from '@/hooks/useMovieList';
import { SearchBar } from '@/components/SearchBar';
import { MovieList } from '@/components/MovieList';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const shouldSearch = searchQuery.trim().length > 0;
  const { data: searchResults, isLoading, error } = useSearchMovies(searchQuery, currentPage, shouldSearch);

  const {
    clientError,
    isMutating,
    totalPages,
    handleToggleFavorite,
    handlePageChange,
    resetItemsPerPage,
    clearError,
  } = useMovieList({
    searchResults,
    isLoading,
    currentPage,
    setCurrentPage,
  });

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    resetItemsPerPage();
    setSearchQuery(trimmedQuery);
    setCurrentPage(1);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text">
              Movie Finder
            </h1>
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>

        {clientError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{clientError}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-xl text-red-500 mb-2">Error loading movies</p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        )}

        {!error && isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Searching for movies...</p>
          </div>
        )}

        {!error && !isLoading && !shouldSearch && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Start Your Search</h2>
            <p className="text-muted-foreground">
              Search for your favorite movies and add them to your favorites
            </p>
          </div>
        )}

        {!error && !isLoading && shouldSearch && searchResults?.data.movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No movies found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {!error && !isLoading && shouldSearch && searchResults && searchResults.data.movies.length > 0 && (
          <MovieList
            movies={searchResults.data.movies}
            currentPage={currentPage}
            totalPages={totalPages}
            isMutating={isMutating}
            onToggleFavorite={handleToggleFavorite}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
