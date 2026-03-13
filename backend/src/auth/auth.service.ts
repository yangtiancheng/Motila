import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import type { RequestMeta } from '../common/current-request-meta.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { EmailConfigService } from '../email-config/email-config.service';
import { RiskCaptchaService } from '../risk-control/risk-captcha.service';
import { RiskRuntimeService } from '../risk-control/risk-runtime.service';
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
    private readonly riskRuntimeService: RiskRuntimeService,
    private readonly riskCaptchaService: RiskCaptchaService,
  ) {}

  getCaptcha(scene: 'login' | 'register' | 'forgotPassword') {
    return this.riskCaptchaService.createCaptcha(scene);
  }

  async register(dto: RegisterDto, requestMeta?: RequestMeta) {
    const account = dto.email?.trim().toLowerCase() || dto.username?.trim().toLowerCase();
    const ip = this.extractIp(requestMeta);
    const riskDecision = await this.riskRuntimeService.preCheck({ scene: 'register', ip, account });
    if (riskDecision.needCaptcha) {
      this.assertCaptcha('register', dto.captchaId, dto.captchaCode);
    }

    try {
      const existingByUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
      if (existingByUsername) {
        await this.riskRuntimeService.recordResult({ scene: 'register', ip, account, success: false });
        throw new ConflictException('用户名已存在');
      }

      const existingByEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingByEmail) {
        await this.riskRuntimeService.recordResult({ scene: 'register', ip, account, success: false });
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
      await this.riskRuntimeService.recordResult({ scene: 'register', ip, account, success: true });

      return {
        token,
        user: {
          ...user,
          roles: access.roleCodes,
          permissions: access.permissions,
          modules: access.modules,
        },
      };
    } catch (error) {
      if (!(error instanceof ConflictException)) {
        await this.riskRuntimeService.recordResult({ scene: 'register', ip, account, success: false });
      }
      throw error;
    }
  }

  async login(dto: LoginDto, requestMeta?: RequestMeta) {
    const account = dto.username?.trim().toLowerCase();
    const ip = this.extractIp(requestMeta);
    const riskDecision = await this.riskRuntimeService.preCheck({ scene: 'login', ip, account });
    if (riskDecision.needCaptcha) {
      this.assertCaptcha('login', dto.captchaId, dto.captchaCode);
    }

    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });

    if (!user) {
      await this.riskRuntimeService.recordResult({ scene: 'login', ip, account, success: false });
      throw new UnauthorizedException('用户名或密码错误');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.riskRuntimeService.recordResult({ scene: 'login', ip, account, success: false });
      throw new UnauthorizedException('用户名或密码错误');
    }

    const access = await this.rbacService.buildAccessContext(user.id);
    const token = await this.signToken(user.id, user.email, user.role, access);
    await this.riskRuntimeService.recordResult({ scene: 'login', ip, account, success: true });
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

  async forgotPassword(dto: ForgotPasswordDto, requestMeta?: RequestMeta) {
    const username = dto.username?.trim();
    const email = dto.email?.trim().toLowerCase();
    const account = email || username?.toLowerCase();
    const ip = this.extractIp(requestMeta);
    const riskDecision = await this.riskRuntimeService.preCheck({ scene: 'forgotPassword', ip, account });
    if (riskDecision.needCaptcha) {
      this.assertCaptcha('forgotPassword', dto.captchaId, dto.captchaCode);
    }

    if (!username && !email) {
      await this.riskRuntimeService.recordResult({ scene: 'forgotPassword', ip, account, success: false });
      return { ok: false, message: '请填写用户名或邮箱' };
    }

    const genericMessage = '如果账号信息存在且已绑定邮箱，系统会发送重置邮件';

    const where = username && email
      ? {
          username,
          emailConfig: {
            is: {
              emailAddress: email,
            },
          },
        }
      : username
        ? { username }
        : {
            emailConfig: {
              is: {
                emailAddress: email!,
              },
            },
          };

    const user = await this.prisma.user.findFirst({
      where,
      select: { id: true, name: true, username: true },
    });

    if (!user) {
      await this.riskRuntimeService.recordResult({ scene: 'forgotPassword', ip, account, success: true });
      return { ok: true, message: genericMessage };
    }

    const configOwner = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: 'admin' }, { role: UserRole.ADMIN }],
        emailConfig: {
          isNot: null,
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!configOwner?.id) {
      await this.riskRuntimeService.recordResult({ scene: 'forgotPassword', ip, account, success: false });
      return { ok: false, message: '管理员邮箱未配置，请联系管理员处理' };
    }

    const config = await this.emailConfigService.getConfigWithSecret(configOwner.id);
    if (!config?.secret) {
      await this.riskRuntimeService.recordResult({ scene: 'forgotPassword', ip, account, success: false });
      return { ok: false, message: '管理员邮箱未配置，请联系管理员处理' };
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
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      auth: {
        user: config.emailAddress,
        pass: config.secret,
      },
    });

    const targetMailbox = await this.prisma.userEmailConfig.findUnique({
      where: { userId: user.id },
      select: { emailAddress: true },
    });

    const to = targetMailbox?.emailAddress;
    if (!to) {
      await this.riskRuntimeService.recordResult({ scene: 'forgotPassword', ip, account, success: true });
      return { ok: true, message: genericMessage };
    }

    await transporter.sendMail({
      from: config.emailAddress,
      to,
      subject: '[Motila] 密码重置通知',
      text: `你好${user.name ? `，${user.name}` : ''}，\n\n你的 Motila 临时密码为：${tempPassword}\n请登录后立即在个人信息中修改密码。\n\n（系统自动发送，请勿回复）`,
    });

    await this.riskRuntimeService.recordResult({ scene: 'forgotPassword', ip, account, success: true });
    return { ok: true, message: genericMessage };
  }

  private assertCaptcha(scene: 'login' | 'register' | 'forgotPassword', captchaId?: string, captchaCode?: string) {
    if (!captchaId || !captchaCode) {
      throw new HttpException({ message: '请先完成验证码', needCaptcha: true, scene }, HttpStatus.PRECONDITION_REQUIRED);
    }

    const ok = this.riskCaptchaService.verifyCaptcha(scene, captchaId, captchaCode);
    if (!ok) {
      throw new HttpException({ message: '验证码错误或已过期', needCaptcha: true, scene }, HttpStatus.UNAUTHORIZED);
    }
  }

  private generateTempPassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private extractIp(requestMeta?: RequestMeta) {
    const forwardedFor = requestMeta?.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim();
    }
    return requestMeta?.ip;
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
