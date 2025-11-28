import { MovieDto } from "../dto/movie.dto";

export interface OmdbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search?: OmdbMovie[];
  totalResults?: number;
  Response: string;
  Error?: string;
}

export interface FormattedMovie {
  title: string;
  imdbID: string;
  year: number;
  poster: string;
  isFavorite: boolean;
}

export interface SearchMoviesResponse {
  movies: OmdbMovie[];
  totalResults: number;
}

export interface GetMovieByTitleResponse {
  data: {
    movies: FormattedMovie[];
    count: number;
    totalResults: number;
  };
}

export interface MessageResponse {
  data: {
    message: string;
  };
}

export interface GetFavoritesResponse {
  data: {
    favorites: MovieDto[];
    count: number;
    totalResults: number;
    currentPage: number;
    totalPages: number;
  };
}
