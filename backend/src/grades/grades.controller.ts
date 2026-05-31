import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateGradesBatchDto } from './dto/create-grades-batch.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('grades')
@ApiBearerAuth('access-token')
@Controller('grades')
@UseGuards(AuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly service: GradesService) {}

  // BM5 — Nhập điểm cả lớp 1 lần (upsert)
  @Post('batch')
  @Roles('giaovien')
  createBatch(@Body() dto: CreateGradesBatchDto) {
    return this.service.createBatch(dto);
  }

  // Nhập điểm 1 sinh viên
  @Post()
  @Roles('giaovien')
  create(@Body() dto: CreateGradeDto) {
    return this.service.create(dto);
  }

  // Xem bảng điểm: ?maLop=&maDeThi=&hocKy=&namHoc=&page=&limit=
  @Get()
  @Roles('admin', 'giaovien')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('maLop') maLop?: string,
    @Query('maDeThi') maDeThi?: string,
    @Query('hocKy') hocKy?: string,
    @Query('namHoc') namHoc?: string,
  ) {
    return this.service.findAll(
      +page,
      +limit,
      maLop,
      maDeThi ? +maDeThi : undefined,
      hocKy ? +hocKy : undefined,
      namHoc,
    );
  }

  @Get(':id')
  @Roles('admin', 'giaovien')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('giaovien')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGradeDto) {
    return this.service.update(id, dto);
  }

  // Theo bảng phân quyền 1.5.2, không có quyền xoá bảng điểm.
  // Trường hợp đặc biệt cần can thiệp trực tiếp database.
}
