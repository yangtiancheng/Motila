import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { EmailConfigService } from '../email-config/email-config.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
    private readonly emailConfigService: EmailConfigService,
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
      select: { id: true, username: true, email: true, name: true, avatarUrl: true, avatarImage: true, role: true },
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
        avatarImage: user.avatarImage,
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
        avatarImage: true,
        email: true,
        role: true,
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const username = dto.username?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (!username && !email) {
      return { ok: false, message: '请填写用户名或邮箱' };
    }

    const where = username && email
      ? { username, email }
      : username
        ? { username }
        : { email: email! };

    const user = await this.prisma.user.findFirst({
      where,
      select: { id: true, email: true, name: true, username: true },
    });

    if (!user) return { ok: false, message: '用户名或邮箱不存在' };

    const config = await this.emailConfigService.getConfigWithSecret(user.id);
    if (!config?.secret) {
      return { ok: false, message: '未配置可用邮箱，请联系管理员重置密码' };
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.emailAddress,
        pass: config.secret,
      },
    });

    await transporter.sendMail({
      from: config.emailAddress,
      to: user.email,
      subject: '[Motila] 密码重置通知',
      text: `你好${user.name ? `，${user.name}` : ''}，\n\n你的 Motila 临时密码为：${tempPassword}\n请登录后立即在个人信息中修改密码。\n\n（系统自动发送，请勿回复）`,
    });

    return { ok: true, message: '如果账号存在，重置邮件已发送' };
  }

  private generateTempPassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
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
