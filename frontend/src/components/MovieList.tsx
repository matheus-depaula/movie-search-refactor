import { Movie } from '@/types/movie';
import MovieCard from './MovieCard';
import Pagination from './Pagination';
import { FC } from 'react';

interface MovieListProps {
  movies: Movie[];
  currentPage: number;
  totalPages: number;
  isMutating: boolean;
  isFavoritesPage?: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onPageChange: (page: number) => void;
}

export const MovieList: FC<MovieListProps> = ({
  movies,
  currentPage,
  totalPages,
  isMutating,
  isFavoritesPage,
  onToggleFavorite,
  onPageChange,
}) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {movies.map((movie, i) => (
          <MovieCard
            key={`${movie.imdbID}-${i}`}
            movie={movie}
            isFavorite={Boolean(movie.isFavorite || isFavoritesPage)}
            onToggleFavorite={onToggleFavorite}
            disabled={isMutating}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
