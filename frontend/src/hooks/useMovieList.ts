import { useState, useMemo, useRef, useEffect } from "react";
import { useAddToFavorites, useRemoveFromFavorites } from "./useMovies";
import { Movie, SearchMoviesResponse, FavoritesResponse } from "@/types/movie";
import useWindow from "./useWindow";

interface UseMovieListOptions {
  searchResults: SearchMoviesResponse | FavoritesResponse | undefined;
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onNewSearch?: () => void;
}

export function useMovieList({
  searchResults,
  isLoading,
  currentPage,
  setCurrentPage,
  onNewSearch,
}: UseMovieListOptions) {
  const { scrollToTop } = useWindow();
  const [clientError, setClientError] = useState<string | null>(null);
  const itemsPerPageRef = useRef<number | null>(null);

  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();

  const isMutating = addToFavorites.isPending || removeFromFavorites.isPending;

  const isFavoritesResponse = (
    data: SearchMoviesResponse | FavoritesResponse | undefined
  ): data is FavoritesResponse => {
    return data !== undefined && "data" in data && "favorites" in data.data;
  };

  useEffect(() => {
    if (currentPage === 1 && searchResults?.data.count) {
      itemsPerPageRef.current = searchResults.data.count;
    }
  }, [currentPage, searchResults?.data.count]);

  useEffect(() => {
    if (
      !isLoading &&
      isFavoritesResponse(searchResults) &&
      searchResults.data.favorites.length === 0 &&
      currentPage > 1
    ) {
      setCurrentPage(currentPage - 1);
    }
  }, [searchResults, currentPage, isLoading, setCurrentPage]);

  const totalResults = useMemo(() => {
    if (!searchResults?.data.totalResults) return 0;

    const result =
      typeof searchResults.data.totalResults === "string"
        ? parseInt(searchResults.data.totalResults, 10)
        : searchResults.data.totalResults;

    return isNaN(result) ? 0 : result;
  }, [searchResults?.data.totalResults]);

  const totalPages = useMemo(() => {
    if (isFavoritesResponse(searchResults) && searchResults.data.totalPages) {
      return searchResults.data.totalPages;
    }

    if (!searchResults?.data.totalResults) return 0;

    const total = searchResults.data.totalResults;
    const resultsPerPage =
      itemsPerPageRef.current || searchResults?.data.count || 10;

    if (isNaN(total) || resultsPerPage <= 0) return 0;

    return Math.ceil(total / resultsPerPage);
  }, [searchResults]);

  const handleToggleFavorite = (
    movie: Movie,
    isFavoritesPage: boolean = false
  ) => {
    if (isMutating) return;

    setClientError(null);

    if (movie.isFavorite || isFavoritesPage) {
      removeFromFavorites.mutate(movie.imdbID, {
        onError: (err) => {
          setClientError(`Failed to remove "${movie.title}" from favorites`);
          console.error("Failed to remove favorite:", err);
        },
      });
    } else {
      addToFavorites.mutate(movie, {
        onError: (err) => {
          setClientError(
            `Failed to add "${movie.title}" to favorites. ${err.message}.`
          );
          console.error("Failed to add favorite:", err);
        },
      });
    }
  };

  const handlePageChange = (page: number) => {
    if (!Number.isFinite(page) || isNaN(page)) return;

    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      scrollToTop();
    }
  };

  const resetItemsPerPage = () => {
    itemsPerPageRef.current = null;
    onNewSearch?.();
  };

  const clearError = () => setClientError(null);

  return {
    clientError,
    isMutating,
    totalResults,
    totalPages,
    handleToggleFavorite,
    handlePageChange,
    resetItemsPerPage,
    clearError,
  };
}
