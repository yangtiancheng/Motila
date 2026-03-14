import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { ListLoginHistoryQueryDto } from './dto/login-history.dto';
import { LoginHistoryService } from './login-history.service';

@Controller('login-history')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('login-history')
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  @Get()
  @RequirePermission('login-history.read')
  list(@Query() query: ListLoginHistoryQueryDto) {
    return this.loginHistoryService.list(query);
  }
}
