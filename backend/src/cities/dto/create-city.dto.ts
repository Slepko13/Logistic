import { IsString, MaxLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @MaxLength(64)
  name!: string;
}
