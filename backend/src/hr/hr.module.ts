import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { HrController } from './hr.controller';

@Module({
  imports: [ModulesModule],
  controllers: [HrController],
})
export class HrModule {}
