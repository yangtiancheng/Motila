import { Module } from '@nestjs/common';
import { EmailConfigModule } from '../email-config/email-config.module';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [PrismaModule, EmailConfigModule, RbacModule, ModulesModule],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {}
