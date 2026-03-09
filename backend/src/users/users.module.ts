import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SystemAdminBootstrapService } from './system-admin.bootstrap.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService, SystemAdminBootstrapService],
  exports: [UsersService],
})
export class UsersModule {}
