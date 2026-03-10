import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../common/jwt-user.type';
import { RBAC_MODULE_KEY, RBAC_PERMISSION_KEY } from './rbac.decorator';
import { RbacService } from './rbac.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    if (!user?.sub) throw new UnauthorizedException('未登录');

    const requiredModule = this.reflector.getAllAndOverride<string | undefined>(
      RBAC_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermission = this.reflector.getAllAndOverride<string | undefined>(
      RBAC_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredModule) {
      await this.rbacService.assertHasModule(user.sub, requiredModule);
    }

    if (requiredPermission) {
      await this.rbacService.assertHasPermission(user.sub, requiredPermission);
    }

    return true;
  }
}
