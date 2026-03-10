import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleLifecycleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeModuleStatusDto } from './dto/change-module-status.dto';
import { ListModulesQueryDto } from './dto/list-modules.query.dto';

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListModulesQueryDto) {
    return this.prisma.featureModule.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      include: {
        dependencies: {
          select: {
            dependsOnCode: true,
          },
        },
        dependents: {
          select: {
            moduleCode: true,
          },
        },
      },
    });
  }

  async assertEnabled(code: string) {
    const found = await this.prisma.featureModule.findUnique({
      where: { code },
      select: { code: true, status: true },
    });

    if (!found || found.status !== ModuleLifecycleStatus.ENABLED) {
      throw new ForbiddenException(`模块 ${code} 当前未启用`);
    }
  }

  async getOne(code: string) {
    const module = await this.prisma.featureModule.findUnique({
      where: { code },
      include: {
        dependencies: {
          select: {
            dependsOnCode: true,
          },
        },
        dependents: {
          select: {
            moduleCode: true,
          },
        },
      },
    });

    if (!module) throw new NotFoundException('模块不存在');
    return module;
  }

  async changeStatus(code: string, dto: ChangeModuleStatusDto) {
    const target = await this.prisma.featureModule.findUnique({
      where: { code },
      include: {
        dependencies: {
          select: {
            dependsOnCode: true,
          },
        },
        dependents: {
          select: {
            moduleCode: true,
          },
        },
      },
    });

    if (!target) throw new NotFoundException('模块不存在');

    if (target.status === dto.status) {
      return target;
    }

    if (target.isCore && dto.status !== ModuleLifecycleStatus.ENABLED) {
      throw new ForbiddenException('核心模块不允许被禁用或卸载');
    }

    if (dto.status === ModuleLifecycleStatus.ENABLED) {
      await this.ensureDependenciesEnabled(code, target.dependencies.map((d) => d.dependsOnCode));
    }

    if (dto.status === ModuleLifecycleStatus.DISABLED || dto.status === ModuleLifecycleStatus.NOT_INSTALLED) {
      await this.ensureNoEnabledDependents(code);
    }

    if (dto.status === ModuleLifecycleStatus.NOT_INSTALLED) {
      const inUse = await this.prisma.featureModule.count({
        where: {
          code,
          status: ModuleLifecycleStatus.ENABLED,
        },
      });
      if (inUse > 0) {
        throw new BadRequestException('启用中的模块不能直接卸载，请先禁用');
      }
    }

    return this.prisma.featureModule.update({
      where: { code },
      data: {
        status: dto.status,
      },
      include: {
        dependencies: {
          select: {
            dependsOnCode: true,
          },
        },
        dependents: {
          select: {
            moduleCode: true,
          },
        },
      },
    });
  }

  private async ensureDependenciesEnabled(code: string, dependencyCodes: string[]) {
    if (dependencyCodes.length === 0) return;

    const deps = await this.prisma.featureModule.findMany({
      where: {
        code: { in: dependencyCodes },
      },
      select: {
        code: true,
        status: true,
      },
    });

    const disabledDeps = deps.filter((dep) => dep.status !== ModuleLifecycleStatus.ENABLED);
    if (disabledDeps.length > 0) {
      throw new BadRequestException(
        `模块 ${code} 依赖未启用：${disabledDeps.map((dep) => dep.code).join(', ')}`,
      );
    }
  }

  private async ensureNoEnabledDependents(code: string) {
    const dependentLinks = await this.prisma.moduleDependency.findMany({
      where: {
        dependsOnCode: code,
      },
      select: {
        moduleCode: true,
      },
    });

    if (dependentLinks.length === 0) return;

    const dependentCodes = dependentLinks.map((item) => item.moduleCode);
    const enabledDependents = await this.prisma.featureModule.findMany({
      where: {
        code: { in: dependentCodes },
        status: ModuleLifecycleStatus.ENABLED,
      },
      select: {
        code: true,
      },
    });

    if (enabledDependents.length > 0) {
      throw new BadRequestException(
        `模块 ${code} 仍被启用模块依赖：${enabledDependents.map((dep) => dep.code).join(', ')}`,
      );
    }
  }
}
