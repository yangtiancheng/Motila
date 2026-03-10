import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ModuleLifecycleStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ChangeModuleStatusDto } from './dto/change-module-status.dto';
import { ListModulesQueryDto } from './dto/list-modules.query.dto';
import { ModulesService } from './modules.service';

@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @Roles('ADMIN')
  list(@Query() query: ListModulesQueryDto) {
    return this.modulesService.list(query);
  }

  @Get('enabled')
  enabled() {
    return this.modulesService.list({ status: ModuleLifecycleStatus.ENABLED });
  }

  @Get(':code')
  @Roles('ADMIN')
  getOne(@Param('code') code: string) {
    return this.modulesService.getOne(code);
  }

  @Patch(':code/status')
  @Roles('ADMIN')
  changeStatus(@Param('code') code: string, @Body() dto: ChangeModuleStatusDto) {
    return this.modulesService.changeStatus(code, dto);
  }
}
