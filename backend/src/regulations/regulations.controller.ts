import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegulationsService } from './regulations.service';
import { CreateRegulationDto } from './dto/create-regulation.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('regulations')
@ApiBearerAuth('access-token')
@Controller('regulations')
@UseGuards(AuthGuard, RolesGuard)
export class RegulationsController {
  constructor(private readonly service: RegulationsService) {}

  @Get()
  @Roles('admin', 'giaovien')
  findAll() {
    return this.service.findAll();
  }

  @Get(':tenThamSo')
  @Roles('admin', 'giaovien')
  findOne(@Param('tenThamSo') tenThamSo: string) {
    return this.service.findOne(tenThamSo);
  }

  // §1.5.2: Admin có quyền Thêm quy định mới
  @Post()
  @Roles('admin')
  create(@Req() req: any, @Body() dto: CreateRegulationDto) {
    const maTKCapNhat = Number(req.user.sub);
    return this.service.create(dto, maTKCapNhat);
  }

  // SĐ9 — Chỉ Admin
  @Patch(':tenThamSo')
  @Roles('admin')
  update(
    @Req() req: any,
    @Param('tenThamSo') tenThamSo: string,
    @Body() dto: UpdateRegulationDto,
  ) {
    const maTKCapNhat = Number(req.user.sub);
    return this.service.update(tenThamSo, dto, maTKCapNhat);
  }

  // §1.5.2: Admin có quyền Xoá quy định
  @Delete(':tenThamSo')
  @Roles('admin')
  remove(@Param('tenThamSo') tenThamSo: string) {
    return this.service.remove(tenThamSo);
  }
}
