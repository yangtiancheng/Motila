import { IsEnum } from 'class-validator';
import { ModuleLifecycleStatus } from '@prisma/client';

export class ChangeModuleStatusDto {
  @IsEnum(ModuleLifecycleStatus)
  status!: ModuleLifecycleStatus;
}
