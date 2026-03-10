import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  imports: [ModulesModule, PrismaModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
