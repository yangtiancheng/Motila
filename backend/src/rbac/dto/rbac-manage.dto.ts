import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

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
