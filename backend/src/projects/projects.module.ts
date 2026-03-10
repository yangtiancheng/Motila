import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ModulesModule, PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
