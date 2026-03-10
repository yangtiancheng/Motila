import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';

type ModuleScopedRequest = {
  originalUrl?: string;
  baseUrl?: string;
  route?: {
    path?: string;
  };
};

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
  constructor(private readonly modulesService: ModulesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ModuleScopedRequest>();

    const routePath = [request.originalUrl, request.baseUrl, request.route?.path]
      .filter(Boolean)
      .join(' ')
      .replace(/^\//, '');

    if (!routePath) return true;

    if (routePath.includes('users')) {
      await this.modulesService.assertEnabled('users');
    }

    if (routePath.includes('audit-logs')) {
      await this.modulesService.assertEnabled('audit');
    }

    return true;
  }
}
