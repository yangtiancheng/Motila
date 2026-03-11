import { Module } from '@nestjs/common';
import { EmailConfigModule } from '../email-config/email-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [PrismaModule, EmailConfigModule],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {}
