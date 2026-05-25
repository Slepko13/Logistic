import { IsInt } from 'class-validator';

export class AddDriverDto {
  @IsInt()
  userId!: number;
}
