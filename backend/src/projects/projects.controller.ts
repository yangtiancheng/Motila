import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { CreateProjectDto, ListProjectsQueryDto, UpdateProjectDto } from './dto/projects.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleEnabledGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('ADMIN')
  list(@Query() query: ListProjectsQueryDto) {
    return this.projectsService.list(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }
}
