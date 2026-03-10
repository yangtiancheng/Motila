import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateSystemConfigDto, UpdateSystemConfigDto } from './system-config.dto';
import { SystemConfigService } from './system-config.service';

@Controller('system-configs')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('active')
  getActive() {
    return this.service.getActive();
  }

  @Post()
  create(@Body() payload: CreateSystemConfigDto) {
    return this.service.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateSystemConfigDto) {
    return this.service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
