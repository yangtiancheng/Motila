import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacGuard } from './rbac.guard';
import { RbacService } from './rbac.service';

@Module({
  imports: [PrismaModule],
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
