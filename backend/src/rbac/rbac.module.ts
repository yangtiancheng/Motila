import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacController } from './rbac.controller';
import { RbacGuard } from './rbac.guard';
import { RbacService } from './rbac.service';

@Module({
  imports: [PrismaModule],
  controllers: [RbacController],
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
