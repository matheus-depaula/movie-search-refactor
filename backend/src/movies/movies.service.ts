import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { MovieDto } from "./dto/movie.dto";
import axios, { AxiosError } from "axios";
import * as fs from "fs";
import * as path from "path";
import { JsonSafeParser } from "../utils/json-safe-parser.util";
import {
  SearchMoviesResponse,
  OmdbSearchResponse,
  GetMovieByTitleResponse,
  OmdbMovie,
  MessageResponse,
  GetFavoritesResponse,
} from "src/movies/types/movies.types";

@Injectable()
export class MoviesService {
  private readonly baseUrl: string;
  private favorites: MovieDto[] = [];
  private readonly favoritesFilePath = path.join(
    process.cwd(),
    "data",
    "favorites.json",
  );

  constructor() {
    if (!process.env.OMDB_API_KEY) {
      throw new Error("OMDB_API_KEY environment variable is required");
    }

    this.baseUrl = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}`;
    this.loadFavorites();
  }

  async searchMovies(
    title: string,
    page: number = 1,
  ): Promise<SearchMoviesResponse> {
    if (!title || !title.trim().length) {
      throw new HttpException(
        "Search title is required",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (page < 1 || page > 100) {
      throw new HttpException(
        "Page must be between 1 and 100",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await axios.get<OmdbSearchResponse>(
        `${this.baseUrl}&s=${encodeURIComponent(title)}&page=${page}`,
      );

      // OMDb returns Response: "True" or "False" as strings
      if (response.data.Response === "False" || response.data.Error) {
        return { movies: [], totalResults: 0 };
      }

      return {
        movies: response.data.Search || [],
        totalResults: Number(response.data.totalResults) || 0,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === HttpStatus.UNAUTHORIZED) {
          throw new HttpException("Invalid API key", HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException(
          "Failed to fetch movies from OMDb API",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        "Internal server error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMovieByTitle(
    title: string,
    page: number = 1,
  ): Promise<GetMovieByTitleResponse> {
    try {
      const response = await this.searchMovies(title, page);

      this.loadFavorites();

      const formattedResponse = response.movies.map((movie: OmdbMovie) => {
        const isFavorite = this.favorites.some(
          (fav) => fav.imdbID.toLowerCase() === movie.imdbID.toLowerCase(),
        );

        return {
          title: movie.Title,
          imdbID: movie.imdbID,
          year: this.parseYear(movie.Year),
          poster: movie.Poster === "N/A" ? "" : movie.Poster,
          isFavorite,
        };
      });

      return {
        data: {
          movies: formattedResponse,
          count: formattedResponse.length,
          totalResults: response.totalResults,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to fetch movie",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  addToFavorites(movieToAdd: MovieDto): MessageResponse {
    if (!movieToAdd || !movieToAdd.imdbID || !movieToAdd.title) {
      throw new HttpException("Invalid movie data", HttpStatus.BAD_REQUEST);
    }

    this.loadFavorites();

    const exists = this.favorites.some(
      (movie) => movie.imdbID.toLowerCase() === movieToAdd.imdbID.toLowerCase(),
    );

    if (exists) {
      throw new HttpException(
        "Movie already in favorites",
        HttpStatus.BAD_REQUEST,
      );
    }

    this.favorites.push(movieToAdd);
    this.saveFavorites();

    return {
      data: {
        message: "Movie added to favorites",
      },
    };
  }

  removeFromFavorites(movieId: string): MessageResponse {
    if (!movieId || !movieId.trim().length) {
      throw new HttpException("Movie ID is required", HttpStatus.BAD_REQUEST);
    }

    this.loadFavorites();

    const initialLength = this.favorites.length;
    this.favorites = this.favorites.filter(
      (movie) => movie.imdbID.toLowerCase() !== movieId.toLowerCase(),
    );

    if (this.favorites.length === initialLength) {
      throw new HttpException(
        "Movie not found in favorites",
        HttpStatus.NOT_FOUND,
      );
    }

    this.saveFavorites();

    return {
      data: {
        message: "Movie removed from favorites",
      },
    };
  }

  getFavorites(page: number = 1, pageSize: number = 10): GetFavoritesResponse {
    this.loadFavorites();

    if (page < 1) {
      throw new HttpException(
        "Page must be greater than 0",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new HttpException(
        "Page size must be between 1 and 100",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.favorites.length) {
      return {
        data: {
          favorites: [],
          count: 0,
          totalResults: 0,
          currentPage: page,
          totalPages: 0,
        },
      };
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFavorites = this.favorites.slice(startIndex, endIndex);
    const totalPages = Math.ceil(this.favorites.length / pageSize);

    if (page > totalPages) {
      return {
        data: {
          favorites: [],
          count: 0,
          totalResults: this.favorites.length,
          currentPage: page,
          totalPages,
        },
      };
    }

    return {
      data: {
        favorites: paginatedFavorites,
        count: paginatedFavorites.length,
        totalResults: this.favorites.length,
        currentPage: page,
        totalPages,
      },
    };
  }

  private ensureDataDirectoryExists(): void {
    const dir = path.dirname(this.favoritesFilePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadFavorites(): void {
    try {
      this.ensureDataDirectoryExists();

      if (!fs.existsSync(this.favoritesFilePath)) {
        this.favorites = [];
        return;
      }

      const fileContent = fs.readFileSync(this.favoritesFilePath, "utf-8");
      const parsed = JsonSafeParser<MovieDto[]>(fileContent);

      this.favorites = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading favorites:", error);
      this.favorites = [];
    }
  }

  private saveFavorites(): void {
    try {
      this.ensureDataDirectoryExists();

      fs.writeFileSync(
        this.favoritesFilePath,
        JSON.stringify(this.favorites, null, 2),
      );
    } catch (error) {
      console.error("Error saving favorites:", error);
      throw new HttpException(
        "Failed to save favorites",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parseYear(yearString: string): number {
    const match = yearString.match(/^\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
  }
}
