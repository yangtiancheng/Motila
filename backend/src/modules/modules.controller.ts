import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ModuleLifecycleStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { ChangeModuleStatusDto } from './dto/change-module-status.dto';
import { ListModulesQueryDto } from './dto/list-modules.query.dto';
import { ModulesService } from './modules.service';

@Controller('modules')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireModule('core')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @RequirePermission('module.read')
  list(@Query() query: ListModulesQueryDto) {
    return this.modulesService.list(query);
  }

  @Get('enabled')
  enabled() {
    return this.modulesService.list({ status: ModuleLifecycleStatus.ENABLED });
  }

  @Get(':code')
  @RequirePermission('module.read')
  getOne(@Param('code') code: string) {
    return this.modulesService.getOne(code);
  }

  @Patch(':code/status')
  @RequirePermission('module.update')
  changeStatus(@Param('code') code: string, @Body() dto: ChangeModuleStatusDto) {
    return this.modulesService.changeStatus(code, dto);
  }
}
