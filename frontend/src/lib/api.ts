import { Movie, SearchMoviesResponse, FavoritesResponse } from "@/types/movie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/movies";

export const movieApi = {
  searchMovies: async (
    query: string,
    page: number = 1
  ): Promise<SearchMoviesResponse> => {
    if (!query || !query.trim().length) {
      throw new Error("Search query is required");
    }

    if (!Number.isFinite(page) || page < 1) {
      throw new Error("Page must be a positive number");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) throw error;

      throw new Error("Failed to search movies");
    }
  },

  getFavorites: async (page: number = 1): Promise<FavoritesResponse> => {
    if (!Number.isFinite(page) || page < 1) {
      throw new Error("Page must be a positive number");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/favorites/list?page=${page}`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to get favorites");
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch favorites");
    }
  },

  addToFavorites: async (movie: Movie): Promise<void> => {
    if (!movie || !movie.imdbID || !movie.title || !movie.year) {
      throw new Error("Movie must have imdbID, title, and year");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: movie.title,
          imdbID: movie.imdbID,
          year: movie.year,
          poster: movie.poster,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to add movie to favorites");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to add movie to favorites");
    }
  },

  removeFromFavorites: async (imdbID: string): Promise<void> => {
    if (!imdbID || imdbID.trim().length === 0) {
      throw new Error("IMDb ID is required");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/favorites/${encodeURIComponent(imdbID)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || "Failed to remove movie from favorites"
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to remove movie from favorites");
    }
  },
};
