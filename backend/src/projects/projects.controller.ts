import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { BatchDeleteProjectsDto, CreateProjectDto, ListProjectsQueryDto, UpdateProjectDto } from './dto/projects.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('project')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermission('project.read')
  list(@Query() query: ListProjectsQueryDto) {
    return this.projectsService.list(query);
  }

  @Get(':id')
  @RequirePermission('project.read')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @RequirePermission('project.create')
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('project.update')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete('batch-delete')
  @RequirePermission('project.update')
  batchDelete(@Body() dto: BatchDeleteProjectsDto) {
    return this.projectsService.deleteMany(dto.ids);
  }
}
