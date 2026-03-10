import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @Length(2, 32)
  code!: string;

  @IsString()
  @Length(2, 32)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 32)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  description?: string;
}

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  roleCodes!: string[];
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  permissionCodes!: string[];
}

export class UpdateRoleModulesDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  moduleCodes!: string[];
}
