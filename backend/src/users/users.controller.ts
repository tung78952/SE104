import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- CÁC API DÀNH CHO CÁ NHÂN NGƯỜI DÙNG (Giáo viên / Admin tự xem) ---

  @Get('me')
  @Roles('admin', 'giaovien')
  getProfile(@Req() req: any) {
    const userId = String(req.user.sub);
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @Roles('admin', 'giaovien')
  updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = String(req.user.sub);
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  // --- CÁC API DÀNH CHO ADMIN ---

  @Get()
  @Roles('admin')
  findAll(@Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.usersService.findAll(+page, +limit);
  }

  @Post()
  @Roles('admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':maTK')
  @Roles('admin')
  findOne(@Param('maTK') maTK: string) {
    return this.usersService.findOne(maTK);
  }

  @Patch(':maTK')
  @Roles('admin')
  update(@Param('maTK') maTK: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(maTK, updateUserDto);
  }

  @Delete(':maTK')
  @Roles('admin')
  remove(@Req() req: any, @Param('maTK') maTK: string) {
    const currentAdminId = String(req.user.sub);
    return this.usersService.remove(maTK, currentAdminId);
  }
}
