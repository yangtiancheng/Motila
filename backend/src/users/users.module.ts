import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SystemAdminBootstrapService } from './system-admin.bootstrap.service';

@Module({
  imports: [PrismaModule, AuditModule, ModulesModule, RbacModule],
  controllers: [UsersController],
  providers: [UsersService, SystemAdminBootstrapService],
  exports: [UsersService],
})
export class UsersModule {}
