import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { EmailProvider } from '@prisma/client';

export class UpsertMyEmailConfigDto {
  @IsEnum(EmailProvider)
  provider!: EmailProvider;

  @IsEmail()
  emailAddress!: string;

  @IsString()
  @IsIn(['authorization_code', 'password'])
  authType!: 'authorization_code' | 'password';

  @IsOptional()
  @IsString()
  @Length(1, 200)
  secret?: string;

  @IsString()
  @Length(1, 255)
  smtpHost!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort!: number;

  @IsBoolean()
  smtpSecure!: boolean;

  @IsString()
  @Length(1, 255)
  imapHost!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort!: number;

  @IsBoolean()
  imapSecure!: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  popHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  popPort?: number;

  @IsOptional()
  @IsBoolean()
  popSecure?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class TestMyEmailConfigDto extends UpsertMyEmailConfigDto {
  @IsOptional()
  @IsEmail()
  testTo?: string;
}
