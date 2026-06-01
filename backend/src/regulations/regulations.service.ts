import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEngineService } from './rule-engine.service';
import { CreateRegulationDto } from './dto/create-regulation.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';

@Injectable()
export class RegulationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  findAll() {
    return this.prisma.quyDinh.findMany({ orderBy: { tenThamSo: 'asc' } });
  }

  // §1.5.2: Admin có quyền Thêm quy định mới
  async create(dto: CreateRegulationDto, maTKCapNhat: number) {
    const exists = await this.prisma.quyDinh.findUnique({ where: { tenThamSo: dto.tenThamSo } });
    if (exists) throw new ConflictException(`Quy định '${dto.tenThamSo}' đã tồn tại`);

    await this.validateValue(dto.tenThamSo, dto.giaTri);

    const created = await this.prisma.quyDinh.create({
      data: {
        tenThamSo: dto.tenThamSo,
        giaTri: dto.giaTri,
        moTa: dto.moTa,
        maTKCapNhat,
        ngayCapNhat: new Date(),
      },
    });
    this.ruleEngine.invalidate(dto.tenThamSo);
    return created;
  }

  async findOne(tenThamSo: string) {
    const record = await this.prisma.quyDinh.findUnique({ where: { tenThamSo } });
    if (!record) throw new NotFoundException(`Quy định '${tenThamSo}' không tồn tại`);
    return record;
  }

  // SĐ9: chỉ Admin gọi được (đã chặn bởi @Roles ở controller). Validate B4 -> Update B5 -> Invalidate cache.
  async update(tenThamSo: string, dto: UpdateRegulationDto, maTKCapNhat: number) {
    await this.findOne(tenThamSo); // ném 404 nếu tham số không tồn tại

    await this.validateValue(tenThamSo, dto.giaTri);

    const updated = await this.prisma.quyDinh.update({
      where: { tenThamSo },
      data: {
        giaTri: dto.giaTri,
        maTKCapNhat,
        ngayCapNhat: new Date(),
      },
    });

    this.ruleEngine.invalidate(tenThamSo);
    return updated;
  }

  // §1.5.2: Admin có quyền Xoá quy định
  async remove(tenThamSo: string) {
    await this.findOne(tenThamSo);
    await this.prisma.quyDinh.delete({ where: { tenThamSo } });
    this.ruleEngine.invalidate(tenThamSo);
    return { message: `Đã xoá quy định '${tenThamSo}'` };
  }

  // SĐ9-B4: kiểm tra kiểu dữ liệu, phạm vi, và quan hệ giữa các tham số
  private async validateValue(tenThamSo: string, giaTri: string) {
    const n = Number(giaTri);
    if (Number.isNaN(n)) {
      throw new BadRequestException(`Giá trị '${giaTri}' không phải là số hợp lệ`);
    }
    if (n < 0) {
      throw new BadRequestException('Giá trị phải là số không âm');
    }

    if (tenThamSo === 'SoCauToiDa') {
      if (!Number.isInteger(n) || n < 1) {
        throw new BadRequestException('SoCauToiDa phải là số nguyên dương ≥ 1');
      }
    }

    if (tenThamSo === 'ThoiLuongMin') {
      if (!Number.isInteger(n) || n < 1) {
        throw new BadRequestException('ThoiLuongMin phải là số nguyên dương (phút)');
      }
      const maxRec = await this.prisma.quyDinh.findUnique({ where: { tenThamSo: 'ThoiLuongMax' } });
      if (maxRec && n >= Number(maxRec.giaTri)) {
        throw new BadRequestException(`ThoiLuongMin (${n}) phải nhỏ hơn ThoiLuongMax (${maxRec.giaTri})`);
      }
    }

    if (tenThamSo === 'ThoiLuongMax') {
      if (!Number.isInteger(n) || n < 1) {
        throw new BadRequestException('ThoiLuongMax phải là số nguyên dương (phút)');
      }
      const minRec = await this.prisma.quyDinh.findUnique({ where: { tenThamSo: 'ThoiLuongMin' } });
      if (minRec && n <= Number(minRec.giaTri)) {
        throw new BadRequestException(`ThoiLuongMax (${n}) phải lớn hơn ThoiLuongMin (${minRec.giaTri})`);
      }
    }

    if (tenThamSo === 'DiemMin') {
      const maxRec = await this.prisma.quyDinh.findUnique({ where: { tenThamSo: 'DiemMax' } });
      if (maxRec && n >= Number(maxRec.giaTri)) {
        throw new BadRequestException(`DiemMin (${n}) phải nhỏ hơn DiemMax (${maxRec.giaTri})`);
      }
    }

    if (tenThamSo === 'DiemMax') {
      const minRec = await this.prisma.quyDinh.findUnique({ where: { tenThamSo: 'DiemMin' } });
      if (minRec && n <= Number(minRec.giaTri)) {
        throw new BadRequestException(`DiemMax (${n}) phải lớn hơn DiemMin (${minRec.giaTri})`);
      }
    }
  }
}
