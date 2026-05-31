import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AddStudentToClassDto } from './dto/add-student.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('classes')
@ApiBearerAuth('access-token')
@Controller('classes')
@UseGuards(AuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  @Get()
  @Roles('admin', 'giaovien')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('maMon') maMon?: string,
  ) {
    return this.service.findAll(+page, +limit, search, maMon);
  }

  @Get(':maLop')
  @Roles('admin', 'giaovien')
  findOne(@Param('maLop') maLop: string) {
    return this.service.findOne(maLop);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateClassDto) {
    return this.service.create(dto);
  }

  @Patch(':maLop')
  @Roles('admin')
  update(@Param('maLop') maLop: string, @Body() dto: UpdateClassDto) {
    return this.service.update(maLop, dto);
  }

  @Delete(':maLop')
  @Roles('admin')
  remove(@Param('maLop') maLop: string) {
    return this.service.remove(maLop);
  }

  // Nested routes — thêm/xoá SinhVien khỏi lớp
  @Post(':maLop/students')
  @Roles('admin')
  addStudent(@Param('maLop') maLop: string, @Body() dto: AddStudentToClassDto) {
    return this.service.addStudent(maLop, dto);
  }

  @Delete(':maLop/students/:maSV')
  @Roles('admin')
  removeStudent(@Param('maLop') maLop: string, @Param('maSV') maSV: string) {
    return this.service.removeStudent(maLop, maSV);
  }
}
