import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [ModulesModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
