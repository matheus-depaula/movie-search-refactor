import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { MovieDto } from "./dto/movie.dto";
import type {
  GetMovieByTitleResponse,
  MessageResponse,
  GetFavoritesResponse,
} from "src/movies/types/movies.types";

@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get("search")
  async searchMovies(
    @Query("q") query: string,
    @Query("page") page?: string,
  ): Promise<GetMovieByTitleResponse> {
    if (!query || !query.trim().length) {
      throw new HttpException(
        "Search query is required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const pageNumber = page ? parseInt(page, 10) : 1;

    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new HttpException(
        "Page must be a positive number",
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.moviesService.getMovieByTitle(query, pageNumber);
  }

  @Post("favorites")
  addToFavorites(@Body() movieToAdd: MovieDto): MessageResponse {
    if (!movieToAdd) {
      throw new HttpException("Movie data is required", HttpStatus.BAD_REQUEST);
    }

    return this.moviesService.addToFavorites(movieToAdd);
  }

  @Delete("favorites/:imdbID")
  removeFromFavorites(@Param("imdbID") imdbID: string): MessageResponse {
    if (!imdbID || !imdbID.trim().length) {
      throw new HttpException("IMDb ID is required", HttpStatus.BAD_REQUEST);
    }

    return this.moviesService.removeFromFavorites(imdbID);
  }

  @Get("favorites/list")
  getFavorites(@Query("page") page?: string): GetFavoritesResponse {
    const pageNumber = page ? parseInt(page, 10) : 1;

    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new HttpException(
        "Page must be a positive number",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.moviesService.getFavorites(pageNumber);
  }
}
