import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, ListEmployeesQueryDto, UpdateEmployeeDto } from './dto/hr.dto';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async listEmployees(query: ListEmployeesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.keyword
        ? {
            OR: [
              { name: { contains: query.keyword } },
              { email: { contains: query.keyword } },
              { department: { contains: query.keyword } },
              { title: { contains: query.keyword } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const found = await this.prisma.employee.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('员工不存在');
    return found;
  }

  async create(dto: CreateEmployeeDto) {
    const exists = await this.prisma.employee.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('员工邮箱已存在');

    return this.prisma.employee.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        department: dto.department,
        title: dto.title,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    if (dto.email) {
      const duplicated = await this.prisma.employee.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (duplicated) throw new ConflictException('员工邮箱已存在');
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        department: dto.department,
        title: dto.title,
        status: dto.status,
      },
    });
  }

  async deleteMany(ids: string[]) {
    const result = await this.prisma.employee.deleteMany({
      where: { id: { in: ids } },
    });
    return { count: result.count };
  }
}
