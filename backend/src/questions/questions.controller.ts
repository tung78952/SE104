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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('questions')
@ApiBearerAuth('access-token')
@Controller('questions')
@UseGuards(AuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  // BM1 — Soạn câu hỏi: chỉ Giảng viên (Admin không soạn câu hỏi theo Mục 1.5)
  @Post()
  @Roles('giaovien')
  create(@Req() req: any, @Body() dto: CreateQuestionDto) {
    const maGV = req.user.maGV as string | null;
    if (!maGV) {
      throw new BadRequestException('Tài khoản giảng viên này chưa được liên kết với mã GV');
    }
    return this.service.create(dto, maGV);
  }

  // BM6 — Tra cứu: ?maMon=&maDoKho=&keyword=&page=&limit=
  @Get()
  @Roles('admin', 'giaovien')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('maMon') maMon?: string,
    @Query('maDoKho') maDoKho?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.findAll(
      +page,
      +limit,
      maMon,
      maDoKho ? +maDoKho : undefined,
      keyword,
    );
  }

  @Get(':id')
  @Roles('admin', 'giaovien')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // §1.5.2: Quản lý câu hỏi — Admin chỉ Xem; chỉ giảng viên chính chủ được Sửa/Xoá
  @Patch(':id')
  @Roles('giaovien')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuestionDto) {
    return this.service.update(id, dto, { maGV: req.user.maGV });
  }

  @Delete(':id')
  @Roles('giaovien')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, { maGV: req.user.maGV });
  }
}
