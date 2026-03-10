import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
  ) {}

  async register(dto: RegisterDto) {
    const existingByUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existingByUsername) {
      throw new ConflictException('用户名已存在');
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingByEmail) {
      throw new ConflictException('邮箱已注册');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: UserRole.USER,
      },
      select: { id: true, username: true, email: true, name: true, avatarUrl: true, role: true },
    });

    const access = await this.rbacService.buildAccessContext(user.id);
    const token = await this.signToken(user.id, user.email, user.role, access);
    return {
      token,
      user: {
        ...user,
        roles: access.roleCodes,
        permissions: access.permissions,
        modules: access.modules,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const access = await this.rbacService.buildAccessContext(user.id);
    const token = await this.signToken(user.id, user.email, user.role, access);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        roles: access.roleCodes,
        permissions: access.permissions,
        modules: access.modules,
      },
    };
  }

  async getMeProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        email: true,
        role: true,
      },
    });
  }

  private async signToken(
    userId: string,
    email: string,
    role: UserRole,
    access: { roleCodes: string[]; permissions: string[]; modules: string[] },
  ) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
      roles: access.roleCodes,
      permissions: access.permissions,
      modules: access.modules,
    });
  }
}
