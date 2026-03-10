import { IsEnum, IsOptional } from 'class-validator';
import { ModuleLifecycleStatus } from '@prisma/client';

export class ListModulesQueryDto {
  @IsOptional()
  @IsEnum(ModuleLifecycleStatus)
  status?: ModuleLifecycleStatus;
}
