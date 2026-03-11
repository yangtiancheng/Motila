import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailConfigController],
  providers: [EmailConfigService],
  exports: [EmailConfigService],
})
export class EmailConfigModule {}
