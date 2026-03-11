import { IsEmail, IsOptional, IsString, Length, ValidateIf } from 'class-validator';

export class ForgotPasswordDto {
  @IsOptional()
  @ValidateIf((o) => !o.email)
  @IsString()
  @Length(1, 64)
  username?: string;

  @IsOptional()
  @ValidateIf((o) => !o.username)
  @IsEmail()
  email?: string;
}
