import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('export')
@ApiBearerAuth('access-token')
@Controller('export')
@UseGuards(AuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('exam/:maDeThi/pdf')
  @Roles('admin', 'giaovien')
  async examPdf(
    @Param('maDeThi', ParseIntPipe) maDeThi: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.service.examPdf(maDeThi);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="de-thi-${maDeThi}.pdf"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('exam/:maDeThi/docx')
  @Roles('admin', 'giaovien')
  async examDocx(
    @Param('maDeThi', ParseIntPipe) maDeThi: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.service.examDocx(maDeThi);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="de-thi-${maDeThi}.docx"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('grades/pdf')
  @Roles('admin', 'giaovien')
  async gradesPdf(
    @Query('maLop') maLop: string,
    @Query('maDeThi') maDeThi: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!maLop || !maDeThi) {
      throw new BadRequestException('Thiếu maLop hoặc maDeThi');
    }
    const buffer = await this.service.gradesPdf(maLop, +maDeThi);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bang-diem-${maLop}-${maDeThi}.pdf"`,
    });
    return new StreamableFile(buffer);
  }
}
