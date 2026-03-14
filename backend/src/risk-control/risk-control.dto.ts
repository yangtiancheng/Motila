import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const SCENES = ['login', 'register', 'forgotPassword'] as const;
const REDIS_DEGRADE_POLICIES = ['ALLOW_WITH_CAPTCHA', 'BLOCK_REQUESTS'] as const;

export const RISK_SCENES = SCENES;

type RiskSceneCode = (typeof SCENES)[number];
type RedisDegradePolicy = (typeof REDIS_DEGRADE_POLICIES)[number];

export class SceneThresholdDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perMinute?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perHour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perDay?: number;
}

export class ScenePolicyDto {
  @IsBoolean()
  enabled!: boolean;

  @ValidateNested()
  @Type(() => SceneThresholdDto)
  thresholds!: SceneThresholdDto;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  captchaAfterFailures!: number;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  captchaTtlSec!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  blockAfterFailures!: number;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  blockTtlSec!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  retryAfterSec!: number;
}

export class RiskScenesDto {
  @ValidateNested()
  @Type(() => ScenePolicyDto)
  login!: ScenePolicyDto;

  @ValidateNested()
  @Type(() => ScenePolicyDto)
  register!: ScenePolicyDto;

  @ValidateNested()
  @Type(() => ScenePolicyDto)
  forgotPassword!: ScenePolicyDto;
}

export class WhiteBlackListDto {
  @IsArray()
  @IsString({ each: true })
  ips!: string[];

  @IsArray()
  @IsString({ each: true })
  accounts!: string[];
}

export class DegradePolicyDto {
  @IsString()
  @IsIn(REDIS_DEGRADE_POLICIES)
  redisUnavailable!: RedisDegradePolicy;
}

export class RiskControlConfigContentDto {
  @IsBoolean()
  enabled!: boolean;

  @ValidateNested()
  @Type(() => RiskScenesDto)
  scenes!: RiskScenesDto;

  @ValidateNested()
  @Type(() => WhiteBlackListDto)
  whitelist!: WhiteBlackListDto;

  @ValidateNested()
  @Type(() => WhiteBlackListDto)
  blacklist!: WhiteBlackListDto;

  @ValidateNested()
  @Type(() => DegradePolicyDto)
  degradePolicy!: DegradePolicyDto;
}

export class UpdateRiskControlConfigDto {
  @ValidateNested()
  @Type(() => RiskControlConfigContentDto)
  content!: RiskControlConfigContentDto;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class PublishRiskControlConfigDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  publishedBy?: string;
}

export class RollbackRiskControlConfigDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  publishedBy?: string;
}

export class ResetRiskByIpDto {
  @IsString()
  ip!: string;

  @IsOptional()
  @IsArray()
  @IsIn(SCENES, { each: true })
  scenes?: RiskSceneCode[];
}

export class ResetRiskByAccountDto {
  @IsString()
  account!: string;

  @IsOptional()
  @IsArray()
  @IsIn(SCENES, { each: true })
  scenes?: RiskSceneCode[];
}

export class ResetRiskAllDto {
  @IsString()
  ip!: string;

  @IsString()
  account!: string;

  @IsOptional()
  @IsArray()
  @IsIn(SCENES, { each: true })
  scenes?: RiskSceneCode[];
}

export type RiskControlConfigContent = {
  enabled: boolean;
  scenes: Record<RiskSceneCode, {
    enabled: boolean;
    thresholds: {
      perMinute?: number;
      perHour?: number;
      perDay?: number;
    };
    captchaAfterFailures: number;
    captchaTtlSec: number;
    blockAfterFailures: number;
    blockTtlSec: number;
    retryAfterSec: number;
  }>;
  whitelist: { ips: string[]; accounts: string[] };
  blacklist: { ips: string[]; accounts: string[] };
  degradePolicy: { redisUnavailable: RedisDegradePolicy };
};
