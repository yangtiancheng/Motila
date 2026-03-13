import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RiskControlConfigContentDto } from './risk-control.dto';

export class RiskControlConfigResponseDto {
  @IsString()
  id!: string;

  @IsBoolean()
  enabled!: boolean;

  version!: number;

  @ValidateNested()
  @Type(() => RiskControlConfigContentDto)
  content!: RiskControlConfigContentDto;

  createdAt!: Date;
  updatedAt!: Date;
}

export class RiskControlVersionResponseDto {
  @IsString()
  id!: string;

  version!: number;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsString()
  createdBy?: string | null;

  @IsOptional()
  @IsString()
  publishedBy?: string | null;

  @IsOptional()
  rolledBackFromVersion?: number | null;

  @IsOptional()
  publishedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;

  @ValidateNested()
  @Type(() => RiskControlConfigContentDto)
  content!: RiskControlConfigContentDto;
}
