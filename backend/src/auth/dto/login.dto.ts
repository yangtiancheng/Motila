import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(4)
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  captchaId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  captchaCode?: string;
}
