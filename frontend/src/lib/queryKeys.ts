export const queryKeys = {
  movies: {
    all: ["movies"] as const,
    search: (query: string, page: number) =>
      ["movies", "search", query, page] as const,
    favorites: (page: number) => ["movies", "favorites", page] as const,
  },
} as const;
