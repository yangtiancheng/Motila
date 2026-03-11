import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { EmailConfigService } from './email-config.service';
import { TestMyEmailConfigDto, UpsertMyEmailConfigDto } from './email-config.dto';

@Controller('email-config')
@UseGuards(JwtAuthGuard)
export class EmailConfigController {
  constructor(private readonly service: EmailConfigService) {}

  @Get('providers/defaults')
  providerDefaults() {
    return this.service.providerDefaults();
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtUser | undefined) {
    return this.service.getMe(user);
  }

  @Put('me')
  upsertMe(
    @CurrentUser() user: JwtUser | undefined,
    @Body() payload: UpsertMyEmailConfigDto,
  ) {
    return this.service.upsertMe(user, payload);
  }

  @Post('me/test')
  testMyConfig(
    @CurrentUser() user: JwtUser | undefined,
    @Body() payload: TestMyEmailConfigDto,
  ) {
    return this.service.testMyConfig(user, payload);
  }
}
