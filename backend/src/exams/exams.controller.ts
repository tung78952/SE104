import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('exams')
@ApiBearerAuth('access-token')
@Controller('exams')
@UseGuards(AuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // BM2 — Lập đề thi: chỉ Giảng viên
  @Post()
  @Roles('giaovien')
  create(@Req() req: any, @Body() dto: CreateExamDto) {
    const maGV = req.user.maGV as string | null;
    if (!maGV) {
      throw new BadRequestException('Tài khoản giảng viên này chưa được liên kết với mã GV');
    }
    return this.service.create(dto, maGV);
  }

  // BM7 — Tra cứu: ?maMon=&hocKy=&namHoc=&page=&limit=
  @Get()
  @Roles('admin', 'giaovien')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('maMon') maMon?: string,
    @Query('hocKy') hocKy?: string,
    @Query('namHoc') namHoc?: string,
  ) {
    return this.service.findAll(
      +page,
      +limit,
      maMon,
      hocKy ? +hocKy : undefined,
      namHoc,
    );
  }

  @Get(':id')
  @Roles('admin', 'giaovien')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // §1.5.2: Quản lý đề thi — Admin chỉ Xem; chỉ giảng viên chính chủ được Sửa/Xoá
  @Patch(':id')
  @Roles('giaovien')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExamDto) {
    return this.service.update(id, dto, { maGV: req.user.maGV });
  }

  @Delete(':id')
  @Roles('giaovien')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, { maGV: req.user.maGV });
  }
}
