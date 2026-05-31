import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // QĐ4: maMon không trùng; tenMon, soTinChi hợp lệ (DTO đã validate)
  async create(dto: CreateSubjectDto) {
    const exists = await this.prisma.monHoc.findUnique({ where: { maMon: dto.maMon } });
    if (exists) throw new ConflictException(`Mã môn '${dto.maMon}' đã tồn tại`);
    return this.prisma.monHoc.create({ data: dto });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const where = search
      ? { OR: [{ maMon: { contains: search } }, { tenMon: { contains: search } }] }
      : {};
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.monHoc.findMany({ where, skip, take: limit, orderBy: { maMon: 'asc' } }),
      this.prisma.monHoc.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(maMon: string) {
    const subject = await this.prisma.monHoc.findUnique({ where: { maMon } });
    if (!subject) throw new NotFoundException(`Môn học '${maMon}' không tồn tại`);
    return subject;
  }

  async update(maMon: string, dto: UpdateSubjectDto) {
    await this.findOne(maMon);
    return this.prisma.monHoc.update({ where: { maMon }, data: dto });
  }

  async remove(maMon: string) {
    await this.findOne(maMon);
    const [cauHoiCount, deThiCount, lopHocCount] = await Promise.all([
      this.prisma.cauHoi.count({ where: { maMon } }),
      this.prisma.deThi.count({ where: { maMon } }),
      this.prisma.lopHoc.count({ where: { maMon } }),
    ]);
    if (cauHoiCount > 0 || deThiCount > 0 || lopHocCount > 0) {
      throw new ConflictException(
        `Không thể xoá môn '${maMon}': còn ${cauHoiCount} câu hỏi, ${deThiCount} đề thi, ${lopHocCount} lớp đang tham chiếu`,
      );
    }
    await this.prisma.monHoc.delete({ where: { maMon } });
    return { message: `Đã xoá môn học '${maMon}'` };
  }
}
