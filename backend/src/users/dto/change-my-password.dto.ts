import { IsString, MinLength } from 'class-validator';

export class ChangeMyPasswordDto {
  @IsString()
  @MinLength(6)
  password!: string;
}
