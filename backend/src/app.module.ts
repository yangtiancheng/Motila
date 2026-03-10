import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { HrModule } from './hr/hr.module';
import { ModulesModule } from './modules/modules.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RbacModule } from './rbac/rbac.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    AuthModule,
    ModulesModule,
    UsersModule,
    AuditModule,
    ProjectsModule,
    HrModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
