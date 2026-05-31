import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('students')
@ApiBearerAuth('access-token')
@Controller('students')
@UseGuards(AuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  @Roles('admin', 'giaovien')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('maLop') maLop?: string,
  ) {
    return this.service.findAll(+page, +limit, search, maLop);
  }

  @Get(':maSV')
  @Roles('admin', 'giaovien')
  findOne(@Param('maSV') maSV: string) {
    return this.service.findOne(maSV);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }

  @Patch(':maSV')
  @Roles('admin')
  update(@Param('maSV') maSV: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(maSV, dto);
  }

  @Delete(':maSV')
  @Roles('admin')
  remove(@Param('maSV') maSV: string) {
    return this.service.remove(maSV);
  }
}
