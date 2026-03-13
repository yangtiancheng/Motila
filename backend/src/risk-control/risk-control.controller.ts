import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import {
  PublishRiskControlConfigDto,
  RollbackRiskControlConfigDto,
  UpdateRiskControlConfigDto,
} from './risk-control.dto';
import { RiskControlService } from './risk-control.service';

@Controller('risk-control')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('risk-control')
export class RiskControlController {
  constructor(private readonly riskControlService: RiskControlService) {}

  @Get('config')
  @RequirePermission('risk.read')
  getConfig() {
    return this.riskControlService.getConfig();
  }

  @Put('config')
  @RequirePermission('risk.update')
  updateDraft(@Body() dto: UpdateRiskControlConfigDto) {
    return this.riskControlService.updateDraft(dto);
  }

  @Post('publish')
  @RequirePermission('risk.update')
  publish(@Body() dto: PublishRiskControlConfigDto) {
    return this.riskControlService.publish(dto);
  }

  @Post('rollback')
  @RequirePermission('risk.update')
  rollback(@Body() dto: RollbackRiskControlConfigDto) {
    return this.riskControlService.rollback(dto);
  }

  @Get('versions')
  @RequirePermission('risk.read')
  listVersions() {
    return this.riskControlService.listVersions();
  }
}
