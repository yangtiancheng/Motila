import { IsString, MinLength } from 'class-validator';

export class ChangeMyPasswordDto {
  @IsString()
  @MinLength(1)
  password!: string;
}
