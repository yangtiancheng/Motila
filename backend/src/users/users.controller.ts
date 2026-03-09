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
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import type { JwtUser } from '../common/jwt-user.type';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtUser | undefined) {
    return user;
  }

  @Patch('me/password')
  changeMyPassword(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    return this.usersService.changeMyPassword(user, dto.password);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser | undefined) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser | undefined,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser | undefined) {
    return this.usersService.remove(id, user);
  }
}
