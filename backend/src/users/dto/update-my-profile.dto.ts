import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @Length(4, 64)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名仅支持字母、数字、下划线' })
  username?: string;

  @IsOptional()
  @IsString()
  @Length(2, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1024)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2 * 1024 * 1024)
  avatarImage?: string;
}
