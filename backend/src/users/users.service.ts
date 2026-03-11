import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import type { JwtUser } from '../common/jwt-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SYSTEM_SUPER_ADMIN } from './system-admin.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private isSystemSuperAdmin(user: { username?: string | null; email?: string | null }) {
    return (
      user.username === SYSTEM_SUPER_ADMIN.username &&
      user.email === SYSTEM_SUPER_ADMIN.email
    );
  }

  async findAll(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const fetchAll = query.pageSize === 0;
    const skip = fetchAll ? 0 : (page - 1) * pageSize;

    const where = {
      ...(query.keyword
        ? {
            OR: [
              { username: { contains: query.keyword } },
              { email: { contains: query.keyword } },
              { name: { contains: query.keyword } },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatarUrl: true,
          avatarImage: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        ...(fetchAll ? {} : { take: pageSize }),
      }),
      this.prisma.user.count({ where }),
    ]);

    const userIds = data.map((item) => item.id);
    const roleMaps = await this.prisma.userRoleMap.findMany({
      where: { userId: { in: userIds } },
      include: { role: true },
    });

    const accessByUserId = new Map<string, { roles: string[] }>();
    for (const map of roleMaps) {
      const entry = accessByUserId.get(map.userId) ?? { roles: [] };
      entry.roles.push(map.role.code);
      accessByUserId.set(map.userId, entry);
    }

    return {
      data: data.map((item) => ({
        ...item,
        roles: accessByUserId.get(item.id)?.roles ?? [],
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
        avatarImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async create(dto: CreateUserDto, actor?: JwtUser) {
    const existsByUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existsByUsername) throw new ConflictException('用户名已存在');

    const existsByEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existsByEmail) throw new ConflictException('邮箱已存在');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        avatarImage: dto.avatarImage,
        passwordHash,
        role: dto.role ?? UserRole.USER,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
        avatarImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (actor) {
      await this.auditService.log({
        action: 'USER_CREATE',
        targetId: created.id,
        targetName: created.name,
        targetEmail: created.email,
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        detail: `创建用户，角色=${created.role}`,
      });
    }

    return created;
  }

  async update(id: string, dto: UpdateUserDto, actor?: JwtUser) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, username: true, email: true, name: true, avatarUrl: true, avatarImage: true },
    });

    if (!existing) throw new NotFoundException('用户不存在');

    if (dto.username) {
      const duplicatedByUsername = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id },
        },
      });
      if (duplicatedByUsername) throw new ConflictException('用户名已存在');
    }

    if (dto.email) {
      const duplicated = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (duplicated) throw new ConflictException('邮箱已存在');
    }

    if (dto.role === UserRole.USER && existing.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new ForbiddenException('系统至少保留一个管理员');
      }
    }

    if (this.isSystemSuperAdmin(existing)) {
      if (dto.role === UserRole.USER) {
        throw new ForbiddenException('系统超级管理员不允许降级为普通用户');
      }
      if (dto.username && dto.username !== existing.username) {
        throw new ForbiddenException('系统超级管理员账号标识不允许修改');
      }
      if (dto.email && dto.email !== existing.email) {
        throw new ForbiddenException('系统超级管理员账号标识不允许修改');
      }
    }

    if (actor && actor.sub === id && dto.role === UserRole.USER) {
      throw new ForbiddenException('不能把自己的角色降为普通用户');
    }

    const data: {
      username?: string;
      email?: string;
      name?: string;
      avatarUrl?: string;
      avatarImage?: string;
      role?: UserRole;
      passwordHash?: string;
    } = {};

    if (dto.username) data.username = dto.username;
    if (dto.email) data.email = dto.email;
    if (dto.name) data.name = dto.name;
    if (dto.avatarUrl) data.avatarUrl = dto.avatarUrl;
    if (dto.avatarImage) data.avatarImage = dto.avatarImage;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
        avatarImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (actor) {
      const changedRole = dto.role && dto.role !== existing.role;
      const changedPassword = !!dto.password;
      const action = changedRole
        ? 'USER_ROLE_CHANGE'
        : changedPassword
          ? 'USER_PASSWORD_RESET'
          : 'USER_UPDATE';

      const details: string[] = [];
      if (dto.username && dto.username !== existing.username) details.push(`username: ${existing.username} -> ${dto.username}`);
      if (dto.email && dto.email !== existing.email) details.push(`email: ${existing.email} -> ${dto.email}`);
      if (dto.name && dto.name !== existing.name) details.push(`name: ${existing.name} -> ${dto.name}`);
      if (dto.avatarUrl && dto.avatarUrl !== existing.avatarUrl) details.push('avatar url: changed');
      if (dto.avatarImage && dto.avatarImage !== existing.avatarImage) details.push('avatar image: changed');
      if (changedRole) details.push(`role: ${existing.role} -> ${dto.role}`);
      if (changedPassword) details.push('password: changed');

      await this.auditService.log({
        action,
        targetId: updated.id,
        targetName: updated.name,
        targetEmail: updated.email,
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        detail: details.join('; ') || '更新用户信息',
      });
    }

    return updated;
  }


  async updateMe(currentUser: JwtUser | undefined, dto: UpdateMyProfileDto) {
    if (!currentUser?.sub) {
      throw new ForbiddenException('未授权访问');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { id: true, username: true, name: true, avatarUrl: true, avatarImage: true, email: true, role: true },
    });

    if (!existing) throw new NotFoundException('用户不存在');

    if (dto.username && dto.username !== existing.username) {
      const duplicated = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id: currentUser.sub },
        },
      });
      if (duplicated) throw new ConflictException('用户名已存在');
    }

    const updated = await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: {
        ...(dto.username ? { username: dto.username } : {}),
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.avatarImage ? { avatarImage: dto.avatarImage } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
        avatarImage: true,
        role: true,
      },
    });

    await this.auditService.log({
      action: 'USER_UPDATE',
      targetId: updated.id,
      targetName: updated.name,
      targetEmail: updated.email,
      actorId: currentUser.sub,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      detail: '用户修改了个人资料',
    });

    return updated;
  }


  async changeMyPassword(currentUser: JwtUser | undefined, password: string) {
    if (!currentUser?.sub) {
      throw new ForbiddenException('未授权访问');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!target) {
      throw new NotFoundException('用户不存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: { passwordHash },
    });

    await this.auditService.log({
      action: 'USER_PASSWORD_RESET',
      targetId: target.id,
      targetName: target.name,
      targetEmail: target.email,
      actorId: currentUser.sub,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      detail: '用户修改了自己的密码',
    });

    return { success: true };
  }

  async batchDelete(ids: string[], actor?: JwtUser) {
    let count = 0;
    for (const id of ids) {
      try {
        await this.remove(id, actor);
        count += 1;
      } catch {
        // ignore single failure to keep batch progressing
      }
    }
    return { count };
  }

  async remove(id: string, actor?: JwtUser) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, username: true, name: true, email: true },
    });

    if (!target) throw new NotFoundException('用户不存在');

    if (actor && actor.sub === id) {
      throw new ForbiddenException('不能删除当前登录用户');
    }

    if (this.isSystemSuperAdmin(target)) {
      throw new ForbiddenException('系统超级管理员不允许删除');
    }

    if (target.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new ForbiddenException('系统至少保留一个管理员');
      }
    }

    await this.prisma.user.delete({ where: { id } });

    if (actor) {
      await this.auditService.log({
        action: 'USER_DELETE',
        targetId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        detail: `删除用户，角色=${target.role}`,
      });
    }

    return { success: true };
  }
}

