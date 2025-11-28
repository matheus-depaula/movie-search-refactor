import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from "class-validator";

export class MovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  imdbID: string;

  @IsInt()
  @Min(1888)
  year: number;

  @IsString()
  @IsOptional()
  poster: string;
}
