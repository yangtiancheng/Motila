import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentRequestMeta, type RequestMeta } from '../common/current-request-meta.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { RbacService } from '../rbac/rbac.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rbacService: RbacService,
  ) {}

  @Get('captcha')
  getCaptcha(@Query('scene') scene?: 'login' | 'register' | 'forgotPassword') {
    return this.authService.getCaptcha(scene ?? 'login');
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @CurrentRequestMeta() requestMeta: RequestMeta) {
    return this.authService.register(dto, requestMeta);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @CurrentRequestMeta() requestMeta: RequestMeta) {
    return this.authService.login(dto, requestMeta);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @CurrentRequestMeta() requestMeta: RequestMeta) {
    return this.authService.forgotPassword(dto, requestMeta);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtUser | undefined) {
    if (!user?.sub) return null;

    const profile = await this.authService.getMeProfile(user.sub);
    if (!profile) return null;

    const access = await this.rbacService.buildAccessContext(user.sub);
    return {
      id: profile.id,
      username: profile.username,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      avatarImage: profile.avatarImage,
      email: profile.email,
      role: profile.role,
      roles: access.roleCodes,
      permissions: access.permissions,
      modules: access.modules,
    };
  }
}
