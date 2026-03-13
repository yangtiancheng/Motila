import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { RiskCaptchaService } from './risk-captcha.service';
import { RiskControlController } from './risk-control.controller';
import { RiskRuntimeService } from './risk-runtime.service';
import { RiskControlService } from './risk-control.service';

@Module({
  imports: [PrismaModule, ModulesModule, RbacModule],
  controllers: [RiskControlController],
  providers: [RiskControlService, RiskRuntimeService, RiskCaptchaService],
  exports: [RiskControlService, RiskRuntimeService, RiskCaptchaService],
})
export class RiskControlModule {}
