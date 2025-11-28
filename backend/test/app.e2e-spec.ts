import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import type { Server } from "http";
import { AppModule } from "./../src/app.module";
import * as fs from "fs";
import * as path from "path";
import {
  GetMovieByTitleResponse,
  MessageResponse,
  GetFavoritesResponse,
  FormattedMovie,
} from "src/movies/types/movies.types";

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

interface TestMovie {
  title: string;
  imdbID: string;
  year: number;
  poster: string;
}

describe("Movies API (e2e)", () => {
  let app: INestApplication;
  let httpServer: ReturnType<typeof request>;
  const testFavoritesPath = path.join(process.cwd(), "data", "favorites.json");
  let originalFavorites: string | null = null;

  beforeAll(async () => {
    // Backup existing favorites if any
    if (fs.existsSync(testFavoritesPath)) {
      originalFavorites = fs.readFileSync(testFavoritesPath, "utf-8");
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    httpServer = request(app.getHttpServer() as Server);
  });

  afterAll(async () => {
    // Restore original favorites
    if (originalFavorites !== null) {
      fs.writeFileSync(testFavoritesPath, originalFavorites);
    } else if (fs.existsSync(testFavoritesPath)) {
      fs.unlinkSync(testFavoritesPath);
    }

    await app.close();
  });

  beforeEach(() => {
    // Clear favorites before each test
    if (fs.existsSync(testFavoritesPath)) {
      fs.writeFileSync(testFavoritesPath, "[]");
    }
  });

  describe("/movies/search (GET)", () => {
    it("should return movies for valid search query", () => {
      return httpServer
        .get("/movies/search?q=Matrix&page=1")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetMovieByTitleResponse;
          expect(body).toHaveProperty("data");
          expect(body.data).toHaveProperty("movies");
          expect(body.data).toHaveProperty("count");
          expect(body.data).toHaveProperty("totalResults");
          expect(Array.isArray(body.data.movies)).toBe(true);
        });
    });

    it("should return 400 for missing query parameter", () => {
      return httpServer
        .get("/movies/search")
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("Search query is required");
        });
    });

    it("should return 400 for empty query parameter", () => {
      return httpServer
        .get("/movies/search?q=")
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("Search query is required");
        });
    });

    it("should return 400 for invalid page parameter", () => {
      return httpServer
        .get("/movies/search?q=Matrix&page=abc")
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("Page must be a positive number");
        });
    });

    it("should return 400 for negative page parameter", () => {
      return httpServer
        .get("/movies/search?q=Matrix&page=-1")
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("Page must be a positive number");
        });
    });

    it("should return empty results for non-existent movie", () => {
      return httpServer
        .get("/movies/search?q=xyzabc123nonexistent&page=1")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetMovieByTitleResponse;
          expect(body.data.movies).toEqual([]);
          expect(body.data.count).toBe(0);
        });
    });

    it("should handle special characters in query", () => {
      return httpServer
        .get("/movies/search?q=Star%20Wars&page=1")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetMovieByTitleResponse;
          expect(body.data.movies.length).toBeGreaterThan(0);
        });
    });
  });

  describe("/movies/favorites (POST)", () => {
    const validMovie: TestMovie = {
      title: "The Matrix",
      imdbID: "tt0133093",
      year: 1999,
      poster: "https://example.com/poster.jpg",
    };

    it("should add a movie to favorites", () => {
      return httpServer
        .post("/movies/favorites")
        .send(validMovie)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          const body = res.body as MessageResponse;
          expect(body.data.message).toContain("added to favorites");
        });
    });

    it("should return 400 when adding duplicate movie", async () => {
      // Add movie first time
      await httpServer
        .post("/movies/favorites")
        .send(validMovie)
        .expect(HttpStatus.CREATED);

      // Try adding again
      return httpServer
        .post("/movies/favorites")
        .send(validMovie)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("already in favorites");
        });
    });

    it("should return 400 for missing required fields", () => {
      return httpServer
        .post("/movies/favorites")
        .send({
          title: "Test Movie",
          // Missing imdbID and year
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return 400 for invalid year type", () => {
      return httpServer
        .post("/movies/favorites")
        .send({
          title: "Test Movie",
          imdbID: "tt1234567",
          year: "not a number",
          poster: "https://example.com/poster.jpg",
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return 400 for year before 1888", () => {
      return httpServer
        .post("/movies/favorites")
        .send({
          title: "Test Movie",
          imdbID: "tt1234567",
          year: 1800,
          poster: "https://example.com/poster.jpg",
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should accept movie without poster", () => {
      return httpServer
        .post("/movies/favorites")
        .send({
          title: "Test Movie",
          imdbID: "tt1234567",
          year: 2000,
        })
        .expect(HttpStatus.CREATED);
    });

    it("should handle case-insensitive duplicate detection", async () => {
      // Add movie with lowercase imdbID
      await httpServer
        .post("/movies/favorites")
        .send({
          ...validMovie,
          imdbID: "tt0133093",
        })
        .expect(HttpStatus.CREATED);

      // Try adding with uppercase
      return httpServer
        .post("/movies/favorites")
        .send({
          ...validMovie,
          imdbID: "TT0133093",
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("already in favorites");
        });
    });
  });

  describe("/movies/favorites/:imdbID (DELETE)", () => {
    const testMovie: TestMovie = {
      title: "The Matrix",
      imdbID: "tt0133093",
      year: 1999,
      poster: "https://example.com/poster.jpg",
    };

    beforeEach(async () => {
      // Add a movie to favorites before each delete test
      await httpServer.post("/movies/favorites").send(testMovie);
    });

    it("should remove a movie from favorites", () => {
      return httpServer
        .delete(`/movies/favorites/${testMovie.imdbID}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as MessageResponse;
          expect(body.data.message).toContain("removed from favorites");
        });
    });

    it("should return 404 when removing non-existent movie", () => {
      return httpServer
        .delete("/movies/favorites/tt9999999")
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("not found in favorites");
        });
    });

    it("should return 400 for empty imdbID", () => {
      return httpServer
        .delete("/movies/favorites/")
        .expect(HttpStatus.NOT_FOUND); // NestJS returns 404 for missing route param
    });

    it("should handle case-insensitive removal", async () => {
      return httpServer
        .delete(`/movies/favorites/TT0133093`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as MessageResponse;
          expect(body.data.message).toContain("removed from favorites");
        });
    });
  });

  describe("/movies/favorites/list (GET)", () => {
    const testMovies: TestMovie[] = [
      {
        title: "The Matrix",
        imdbID: "tt0133093",
        year: 1999,
        poster: "https://example.com/poster1.jpg",
      },
      {
        title: "Inception",
        imdbID: "tt1375666",
        year: 2010,
        poster: "https://example.com/poster2.jpg",
      },
      {
        title: "Interstellar",
        imdbID: "tt0816692",
        year: 2014,
        poster: "https://example.com/poster3.jpg",
      },
    ];

    beforeEach(async () => {
      // Add test movies
      for (const movie of testMovies) {
        await httpServer.post("/movies/favorites").send(movie);
      }
    });

    it("should return list of favorites", () => {
      return httpServer
        .get("/movies/favorites/list")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetFavoritesResponse;
          expect(body.data).toHaveProperty("favorites");
          expect(body.data).toHaveProperty("count");
          expect(body.data).toHaveProperty("totalResults");
          expect(body.data).toHaveProperty("currentPage");
          expect(body.data).toHaveProperty("totalPages");
          expect(body.data.favorites.length).toBe(3);
          expect(body.data.totalResults).toBe(3);
        });
    });

    it("should return empty array when no favorites", () => {
      // Clear favorites
      fs.writeFileSync(testFavoritesPath, "[]");

      return httpServer
        .get("/movies/favorites/list")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetFavoritesResponse;
          expect(body.data.favorites).toEqual([]);
          expect(body.data.count).toBe(0);
          expect(body.data.totalResults).toBe(0);
        });
    });

    it("should handle pagination", () => {
      return httpServer
        .get("/movies/favorites/list?page=1")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetFavoritesResponse;
          expect(body.data.currentPage).toBe(1);
          expect(body.data.totalPages).toBe(1);
        });
    });

    it("should return 400 for invalid page parameter", () => {
      return httpServer
        .get("/movies/favorites/list?page=abc")
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("Page must be a positive number");
        });
    });

    it("should return 400 for negative page", () => {
      return httpServer
        .get("/movies/favorites/list?page=-1")
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain("Page must be a positive number");
        });
    });

    it("should return empty array for page beyond total pages", () => {
      return httpServer
        .get("/movies/favorites/list?page=999")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetFavoritesResponse;
          expect(body.data.favorites).toEqual([]);
          expect(body.data.count).toBe(0);
        });
    });
  });

  describe("Integration: Search and Favorites", () => {
    it("should mark movies as favorites in search results", async () => {
      // Add a movie to favorites
      const favoriteMovie: TestMovie = {
        title: "The Matrix",
        imdbID: "tt0133093",
        year: 1999,
        poster: "https://example.com/poster.jpg",
      };

      await httpServer.post("/movies/favorites").send(favoriteMovie);

      // Search for the movie
      return httpServer
        .get("/movies/search?q=Matrix&page=1")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetMovieByTitleResponse;
          const movies = body.data.movies;
          const matrixMovie = movies.find(
            (m: FormattedMovie) => m.imdbID === favoriteMovie.imdbID,
          );
          expect(matrixMovie).toBeDefined();
          expect(matrixMovie?.isFavorite).toBe(true);
        });
    });

    it("should update favorite status after removal", async () => {
      // Add a movie to favorites
      const favoriteMovie: TestMovie = {
        title: "The Matrix",
        imdbID: "tt0133093",
        year: 1999,
        poster: "https://example.com/poster.jpg",
      };

      await httpServer.post("/movies/favorites").send(favoriteMovie);

      // Remove from favorites
      await httpServer
        .delete(`/movies/favorites/${favoriteMovie.imdbID}`)
        .expect(HttpStatus.OK);

      // Search again - should not be marked as favorite
      return httpServer
        .get("/movies/search?q=Matrix&page=1")
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GetMovieByTitleResponse;
          const movies = body.data.movies;
          const matrixMovie = movies.find(
            (m: FormattedMovie) => m.imdbID === favoriteMovie.imdbID,
          );
          if (matrixMovie) {
            expect(matrixMovie.isFavorite).toBe(false);
          }
        });
    });
  });
});
