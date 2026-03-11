import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @Length(1, 64)
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
