import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleEnabledGuard)
export class HrController {
  @Get('employees')
  @Roles('ADMIN')
  listEmployees() {
    return {
      module: 'hr',
      ready: true,
      message: '人员管理模块骨架已启用，后续可扩展员工档案/组织架构。',
      data: [],
    };
  }
}
