import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import {
  PublishRiskControlConfigDto,
  ResetRiskAllDto,
  ResetRiskByAccountDto,
  ResetRiskByIpDto,
  RollbackRiskControlConfigDto,
  UpdateRiskControlConfigDto,
} from './risk-control.dto';
import { RiskControlService } from './risk-control.service';
import { RiskRuntimeService } from './risk-runtime.service';

@Controller('risk-control')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('risk-control')
export class RiskControlController {
  constructor(
    private readonly riskControlService: RiskControlService,
    private readonly riskRuntimeService: RiskRuntimeService,
  ) {}

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

  @Post('reset/ip')
  @RequirePermission('risk.update')
  resetByIp(@Body() dto: ResetRiskByIpDto) {
    return this.riskRuntimeService.resetByIp(dto.ip, dto.scenes);
  }

  @Post('reset/account')
  @RequirePermission('risk.update')
  resetByAccount(@Body() dto: ResetRiskByAccountDto) {
    return this.riskRuntimeService.resetByAccount(dto.account, dto.scenes);
  }

  @Post('reset/all')
  @RequirePermission('risk.update')
  async resetAll(@Body() dto: ResetRiskAllDto) {
    const ipResult = await this.riskRuntimeService.resetByIp(dto.ip, dto.scenes);
    const accountResult = await this.riskRuntimeService.resetByAccount(dto.account, dto.scenes);
    return {
      targetType: 'all' as const,
      target: { ip: ipResult.target, account: accountResult.target },
      scenes: dto.scenes ?? ipResult.scenes,
      deletedKeys: ipResult.deletedKeys + accountResult.deletedKeys,
      storage: ipResult.storage,
      detail: { ip: ipResult, account: accountResult },
    };
  }
}
