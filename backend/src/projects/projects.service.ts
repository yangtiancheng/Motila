import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, ListProjectsQueryDto, UpdateProjectDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProjectsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.keyword
        ? {
            OR: [
              { name: { contains: query.keyword } },
              { code: { contains: query.keyword } },
              { description: { contains: query.keyword } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const found = await this.prisma.project.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('项目不存在');
    return found;
  }

  async create(dto: CreateProjectDto) {
    const exists = await this.prisma.project.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException('项目编码已存在');

    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    if (dto.code) {
      const duplicated = await this.prisma.project.findFirst({
        where: {
          code: dto.code,
          NOT: { id },
        },
      });
      if (duplicated) throw new ConflictException('项目编码已存在');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteMany(ids: string[]) {
    const result = await this.prisma.project.deleteMany({
      where: { id: { in: ids } },
    });
    return { count: result.count };
  }
}
