import { IsBoolean, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateSystemConfigDto {
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsString()
  @Length(2, 100)
  title!: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoImage?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  title?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoImage?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
