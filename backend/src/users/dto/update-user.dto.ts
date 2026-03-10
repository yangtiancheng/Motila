import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名仅支持字母、数字、下划线' })
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  avatarImage?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
