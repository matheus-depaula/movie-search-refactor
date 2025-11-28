# Changes Document

## Backend Fixes

### movies.service.ts

**Type Safety**
- Fixed `favorites: any[]` to `favorites: MovieDto[]` with proper typing
- Added proper TypeScript interfaces for API responses

**Error Handling**
- Added try-catch blocks for all async operations
- Implemented proper exception throwing instead of returning HttpException objects
- Added AxiosError handling for API failures with proper status codes
- Added error handling for file operations

**Input Validation**
- Added validation for empty/null title in `searchMovies()`
- Added page number range validation (1-100)
- Added validation for movie data in `addToFavorites()`
- Added validation for movieId in `removeFromFavorites()`

**OMDb API Quirks**
- Fixed string boolean check: `Response === "False"` instead of `=== false`
- Added `encodeURIComponent()` for search queries
- Implemented `parseYear()` to handle year ranges like "1999-2000"
- Handle poster "N/A" values properly

**Data Staleness**
- Call `loadFavorites()` before every read operation to ensure fresh data
- Added `ensureDataDirectoryExists()` to create data directory if missing

**File System**
- Added directory existence check and creation
- Implemented JsonSafeParser utility for safe JSON parsing
- Added comprehensive error handling for file I/O operations

**API Response Structure**
- Return proper response structures consistently
- Convert totalResults to number for consistency

### movies.controller.ts

**Input Validation**
- Added validation for empty/missing query parameters
- Added NaN checks after `parseInt()` operations
- Added positive number validation for page parameters
- Added trim() validation for string inputs
- Throw proper HttpException for invalid inputs

**Error Handling**
- Added null/undefined checks for request body
- Proper exception throwing with appropriate HTTP status codes

### dto/movie.dto.ts

**Validation**
- Added class-validator decorators (`@IsString`, `@IsNotEmpty`, `@IsInt`, `@Min`)
- Year validation with minimum 1888 (first movie year)
- Made poster optional with `@IsOptional`

### utils/json-safe-parser.util.ts

**New File - Safe JSON Parser Utility**
- Created safe JSON parser to handle corrupted/invalid JSON files
- Returns null on parse failure instead of throwing
- Generic type support for type safety
- Prevents application crashes from malformed JSON data

### test/app.e2e-spec.ts

**Enhanced E2E Test Coverage**
- Added comprehensive end-to-end tests for all API endpoints
- Test coverage for search movies endpoint with validation
- Test coverage for favorites CRUD operations (add, remove, list)
- Edge case testing (invalid inputs, empty queries, NaN page numbers)
- Error handling tests (404, 400, unauthorized responses)
- Pagination testing for favorites list
- Duplicate favorite addition prevention tests
- Case-insensitive imdbID matching tests

## Key Improvements

1. **Security**: Removed hardcoded API key fallback, enforces environment variable
2. **Robustness**: All file operations guarded with error handling
3. **Data Integrity**: Reload favorites from file before operations
4. **API Compatibility**: Fixed OMDb API string boolean handling
5. **Edge Cases**: Proper handling of empty results, missing fields, invalid inputs
6. **Type Safety**: Consistent TypeScript typing throughout
7. **Error Responses**: Throw exceptions instead of returning them
8. **Performance**: Use `some()` instead of `find()` for existence checks
9. **Case Sensitivity**: Lowercase comparison for imdbID matching
10. **Empty States**: Return empty arrays instead of throwing errors for no favorites

## Frontend Fixes

### lib/api.ts

**Environment Configuration**
- Changed hardcoded API URL to use `NEXT_PUBLIC_API_URL` environment variable
- Added fallback to localhost for development

**Input Validation**
- Added validation for empty/null query strings
- Added page number validation (positive, finite numbers)
- Added movie object validation before posting

**Error Handling**
- Added `response.ok` checks before parsing JSON
- Proper try-catch blocks for all API calls
- Safe error parsing with fallback messages
- Proper error propagation with meaningful messages

**URL Encoding**
- Added `encodeURIComponent()` for search queries to handle special characters

**Request Validation**
- Validate movie has required fields (imdbID, title, year) before adding to favorites
- Trim validation for imdbID in remove operation

### hooks/useMovies.ts

**Type Safety**
- Added proper TypeScript generics for useQuery hooks
- Proper typing for all hook return values

**Query Configuration**
- Added retry logic (retry: 1) to prevent infinite retries on errors
- Added staleTime configuration (5 min for search, 1 min for favorites)
- Created centralized query keys in `lib/queryKeys.ts`

**Cache Management**
- Improved query invalidation strategy using centralized query keys
- Invalidate all movie-related queries on mutations

### hooks/useMovieList.ts

**New File - Custom Movie List Hook**
- Created reusable hook for movie list logic
- Handles toggle favorite with optimistic updates
- Manages pagination logic
- Tracks mutation state (loading/disabled)
- Client-side error handling
- Safe navigation on empty pages
- Centralizes list management logic for both search and favorites pages

### components/MovieCard.tsx

**Performance Optimization**
- Wrapped component with `React.memo()` to prevent unnecessary re-renders
- Added proper displayName for debugging

**Image Error Handling**
- Added `onError` handler for broken images
- State management for image load failures
- Enhanced poster validation (empty strings, N/A values)
- Graceful fallback to placeholder

**Loading States**
- Added `disabled` prop to prevent race conditions
- Visual disabled state styling (opacity, cursor-not-allowed)
- Prevents multiple clicks during mutations

### app/favorites/page.tsx

**Error Handling**
- Added error state handling for API failures
- Display error messages to users
- Separate client-side and server-side errors

**Loading States**
- Added loading spinner during data fetch
- Loading message for better UX

**Empty States**
- Proper handling of zero favorites
- Helpful message and call-to-action
- Navigate to search page button

**Type Safety**
- Fixed totalResults type handling (removed toString/parseInt workaround)
- Proper null checks for data

**Component Refactoring**
- Extracted movie list logic to `useMovieList` hook
- Extracted movie grid to `MovieList` component for reusability
- Cleaner, more maintainable code structure

### types/movie.ts

**Type Consistency**
- Fixed `totalResults` type mismatch in `FavoritesResponse` (string → number)
- Made `poster` optional in Movie interface
- Consistent types across all response interfaces

### components/MovieList.tsx

**New File - Reusable Movie List Component**
- Created reusable MovieList component for displaying movie grids
- Handles both search results and favorites
- Integrated pagination
- Supports disabled state during mutations
- Reduces code duplication between pages
- Responsive grid layout
### lib/queryKeys.ts

**New File - Query Keys Factory**
- Centralized query key management for React Query
- Type-safe query key factory
- Prevents typos and ensures consistency
- Easier query invalidation
- Follows React Query best practices

### hooks/useWindow.ts

**New File - Window Utilities Hook**
- SSR-safe window access check
- Scroll to top functionality with smooth behavior
- Prevents errors in server-side rendering
- Reusable window-related utilities

### types/httpStatusCode.ts

**New File - HTTP Status Code Enum**
- Centralized HTTP status code definitions
- Type-safe status code usage
- Better code readability and maintainability
- Standard HTTP status codes (200, 201, 400, 401, 404, 500, etc.)

### components/ui/Chevron.tsx

**New File - Chevron Icon Component**
- Reusable chevron SVG component
- Supports left and right directions
- Type-safe props with TypeScript
- Customizable className for styling
- Used in pagination controlss consistency
- Easier query invalidation

## Key Improvements

### Backend
1. **Security**: Removed hardcoded API key fallback, enforces environment variable
2. **Robustness**: All file operations guarded with error handling
3. **Data Integrity**: Reload favorites from file before operations
4. **API Compatibility**: Fixed OMDb API string boolean handling
5. **Edge Cases**: Proper handling of empty results, missing fields, invalid inputs
6. **Type Safety**: Consistent TypeScript typing throughout
7. **Error Responses**: Throw exceptions instead of returning them
8. **Performance**: Use `some()` instead of `find()` for existence checks
9. **Case Sensitivity**: Lowercase comparison for imdbID matching
10. **Empty States**: Return empty arrays instead of throwing errors for no favorites
11. **Test Coverage**: Comprehensive E2E tests covering all endpoints and edge cases

### Frontend
1. **Environment Variables**: API URL from environment configuration
2. **Error Handling**: Comprehensive error handling with user-friendly messages
3. **Input Validation**: All user inputs validated before API calls
4. **URL Encoding**: Proper encoding of search queries
5. **Type Safety**: Fixed type mismatches between frontend and backend
6. **Performance**: React.memo for components, staleTime for queries
7. **Loading States**: Proper loading indicators and disabled states
8. **Image Handling**: Graceful fallback for broken images
9. **Code Reusability**: Custom hooks and shared components
10. **User Experience**: Better error messages, loading states, empty states
11. **Race Conditions**: Disabled buttons during mutations
12. **Query Management**: Centralized query keys and optimized cache invalidation
