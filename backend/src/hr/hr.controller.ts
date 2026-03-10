import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { CreateEmployeeDto, ListEmployeesQueryDto, UpdateEmployeeDto } from './dto/hr.dto';
import { HrService } from './hr.service';

@Controller('hr')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  @RequirePermission('hr.read')
  listEmployees(@Query() query: ListEmployeesQueryDto) {
    return this.hrService.listEmployees(query);
  }

  @Get('employees/:id')
  @RequirePermission('hr.read')
  findOne(@Param('id') id: string) {
    return this.hrService.findOne(id);
  }

  @Post('employees')
  @RequirePermission('hr.create')
  create(@Body() dto: CreateEmployeeDto) {
    return this.hrService.create(dto);
  }

  @Patch('employees/:id')
  @RequirePermission('hr.update')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.update(id, dto);
  }
}
