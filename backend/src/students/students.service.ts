import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const exists = await this.prisma.sinhVien.findUnique({ where: { maSV: dto.maSV } });
    if (exists) throw new ConflictException(`Mã sinh viên '${dto.maSV}' đã tồn tại`);

    const lopExists = await this.prisma.lopHoc.findUnique({ where: { maLop: dto.maLop } });
    if (!lopExists) throw new NotFoundException(`Lớp '${dto.maLop}' không tồn tại`);

    return this.prisma.sinhVien.create({ data: dto });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, maLop?: string) {
    const where: any = {};
    if (maLop) where.maLop = maLop;
    if (search) {
      where.OR = [{ maSV: { contains: search } }, { hoTen: { contains: search } }];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.sinhVien.findMany({
        where,
        skip,
        take: limit,
        include: { lopHoc: { select: { tenLop: true, maMon: true } } },
        orderBy: { maSV: 'asc' },
      }),
      this.prisma.sinhVien.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(maSV: string) {
    const sv = await this.prisma.sinhVien.findUnique({
      where: { maSV },
      include: { lopHoc: { select: { tenLop: true, maMon: true } } },
    });
    if (!sv) throw new NotFoundException(`Sinh viên '${maSV}' không tồn tại`);
    return sv;
  }

  async update(maSV: string, dto: UpdateStudentDto) {
    await this.findOne(maSV);
    if (dto.maLop) {
      const lopExists = await this.prisma.lopHoc.findUnique({ where: { maLop: dto.maLop } });
      if (!lopExists) throw new NotFoundException(`Lớp '${dto.maLop}' không tồn tại`);
    }
    return this.prisma.sinhVien.update({ where: { maSV }, data: dto });
  }

  async remove(maSV: string) {
    await this.findOne(maSV);
    const bdCount = await this.prisma.bangDiem.count({ where: { maSV } });
    if (bdCount > 0) {
      throw new ConflictException(
        `Không thể xoá sinh viên '${maSV}': còn ${bdCount} dòng điểm`,
      );
    }
    await this.prisma.sinhVien.delete({ where: { maSV } });
    return { message: `Đã xoá sinh viên '${maSV}'` };
  }
}
