import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { ListSendLogsQueryDto, SendEmailDto } from './dto/emails.dto';
import { EmailsService } from './emails.service';

@Controller('emails')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('core')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send')
  @RequirePermission('dashboard.read')
  send(@CurrentUser() user: JwtUser | undefined, @Body() dto: SendEmailDto) {
    return this.emailsService.send(user, dto);
  }

  @Get('send-logs')
  @RequirePermission('dashboard.read')
  logs(@CurrentUser() user: JwtUser | undefined, @Query() query: ListSendLogsQueryDto) {
    return this.emailsService.logs(user, query);
  }
}
