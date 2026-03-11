import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { ListInboxQueryDto, ListSendLogsQueryDto, SendEmailDto, SyncEmailsDto } from './dto/emails.dto';
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

  @Post('sync')
  @RequirePermission('dashboard.read')
  sync(@CurrentUser() user: JwtUser | undefined, @Body() dto: SyncEmailsDto) {
    return this.emailsService.syncInbox(user, dto.limit ?? 20);
  }

  @Get('inbox')
  @RequirePermission('dashboard.read')
  inbox(@CurrentUser() user: JwtUser | undefined, @Query() query: ListInboxQueryDto) {
    return this.emailsService.inbox(user, query);
  }

  @Get(':id')
  @RequirePermission('dashboard.read')
  detail(@CurrentUser() user: JwtUser | undefined, @Param('id') id: string) {
    return this.emailsService.detail(user, id);
  }
}
