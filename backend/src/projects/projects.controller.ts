import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleEnabledGuard)
export class ProjectsController {
  @Get()
  @Roles('ADMIN')
  list() {
    return {
      module: 'project',
      ready: true,
      message: '项目管理模块骨架已启用，后续可扩展项目列表/看板/里程碑。',
      data: [],
    };
  }
}
