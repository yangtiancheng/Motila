import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { CreateEmployeeDto, ListEmployeesQueryDto, UpdateEmployeeDto } from './dto/hr.dto';
import { HrService } from './hr.service';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleEnabledGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  @Roles('ADMIN')
  listEmployees(@Query() query: ListEmployeesQueryDto) {
    return this.hrService.listEmployees(query);
  }

  @Get('employees/:id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.hrService.findOne(id);
  }

  @Post('employees')
  @Roles('ADMIN')
  create(@Body() dto: CreateEmployeeDto) {
    return this.hrService.create(dto);
  }

  @Patch('employees/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.update(id, dto);
  }
}
