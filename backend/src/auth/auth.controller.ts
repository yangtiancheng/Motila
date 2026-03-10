import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { RbacService } from '../rbac/rbac.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rbacService: RbacService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtUser | undefined) {
    if (!user?.sub) return null;

    const access = await this.rbacService.buildAccessContext(user.sub);
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
      roles: access.roleCodes,
      permissions: access.permissions,
      modules: access.modules,
    };
  }
}
