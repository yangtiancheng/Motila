import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { LoginHistoryController } from './login-history.controller';
import { LoginHistoryService } from './login-history.service';

@Module({
  imports: [PrismaModule, RbacModule, ModulesModule],
  controllers: [LoginHistoryController],
  providers: [LoginHistoryService],
  exports: [LoginHistoryService],
})
export class LoginHistoryModule {}
