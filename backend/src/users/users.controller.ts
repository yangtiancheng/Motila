import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { BatchDeleteUsersDto } from './dto/batch-delete-users.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtUser | undefined) {
    return user;
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMe(user, dto);
  }

  @Patch('me/password')
  changeMyPassword(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    return this.usersService.changeMyPassword(user, dto.password);
  }

  @Get()
  @RequirePermission('users.read')
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('users.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermission('users.create')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser | undefined) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermission('users.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser | undefined,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete('batch-delete')
  @RequirePermission('users.delete')
  batchDelete(@Body() dto: BatchDeleteUsersDto, @CurrentUser() user: JwtUser | undefined) {
    return this.usersService.batchDelete(dto.ids, user);
  }

  @Delete(':id')
  @RequirePermission('users.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser | undefined) {
    return this.usersService.remove(id, user);
  }
}
