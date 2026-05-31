import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // BM8.1 — Báo cáo tổng hợp đề thi theo môn
  @Get('exams-by-subject')
  @Roles('admin', 'giaovien')
  examsBySubject(
    @Query('namHoc') namHoc: string,
    @Query('hocKy') hocKy?: string,
  ) {
    return this.service.examsBySubject(namHoc, hocKy ? +hocKy : undefined);
  }

  // BM8.2 — Báo cáo kết quả thi theo lớp
  @Get('results-by-class')
  @Roles('admin', 'giaovien')
  resultsByClass(
    @Query('namHoc') namHoc: string,
    @Query('hocKy') hocKy?: string,
    @Query('maMon') maMon?: string,
  ) {
    return this.service.resultsByClass(namHoc, hocKy ? +hocKy : undefined, maMon);
  }

  // Dashboard tổng quan (mục 1.6 báo cáo — chức năng nâng cao)
  // Trả về số đếm + điểm TB, role-based: admin xem total system, GV xem riêng mình.
  @Get('overview')
  @Roles('admin', 'giaovien')
  overview(@Req() req: any) {
    return this.service.overview({
      vaiTro: req.user.vaiTro,
      maGV: req.user.maGV ?? null,
    });
  }
}
