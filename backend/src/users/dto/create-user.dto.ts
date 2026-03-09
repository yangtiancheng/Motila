import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(4)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名仅支持字母、数字、下划线' })
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
