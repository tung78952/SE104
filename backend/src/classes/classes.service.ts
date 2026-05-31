import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AddStudentToClassDto } from './dto/add-student.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  // QĐ3: maLop không trùng; maMon phải tồn tại; tenLop/maLop không rỗng (DTO đã validate)
  async create(dto: CreateClassDto) {
    const exists = await this.prisma.lopHoc.findUnique({ where: { maLop: dto.maLop } });
    if (exists) throw new ConflictException(`Mã lớp '${dto.maLop}' đã tồn tại`);

    const monExists = await this.prisma.monHoc.findUnique({ where: { maMon: dto.maMon } });
    if (!monExists) throw new NotFoundException(`Môn học '${dto.maMon}' không tồn tại`);

    return this.prisma.lopHoc.create({ data: dto });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, maMon?: string) {
    const where: any = {};
    if (maMon) where.maMon = maMon;
    if (search) {
      where.OR = [{ maLop: { contains: search } }, { tenLop: { contains: search } }];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.lopHoc.findMany({
        where,
        skip,
        take: limit,
        include: { monHoc: { select: { tenMon: true } }, _count: { select: { sinhViens: true } } },
        orderBy: { maLop: 'asc' },
      }),
      this.prisma.lopHoc.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(maLop: string) {
    const lop = await this.prisma.lopHoc.findUnique({
      where: { maLop },
      include: {
        monHoc: { select: { tenMon: true, soTinChi: true } },
        sinhViens: { orderBy: { maSV: 'asc' } },
      },
    });
    if (!lop) throw new NotFoundException(`Lớp học '${maLop}' không tồn tại`);
    return lop;
  }

  async update(maLop: string, dto: UpdateClassDto) {
    await this.findOne(maLop);
    if (dto.maMon) {
      const monExists = await this.prisma.monHoc.findUnique({ where: { maMon: dto.maMon } });
      if (!monExists) throw new NotFoundException(`Môn học '${dto.maMon}' không tồn tại`);
    }
    return this.prisma.lopHoc.update({ where: { maLop }, data: dto });
  }

  async remove(maLop: string) {
    await this.findOne(maLop);
    const [svCount, bdCount] = await Promise.all([
      this.prisma.sinhVien.count({ where: { maLop } }),
      this.prisma.bangDiem.count({ where: { maLop } }),
    ]);
    if (svCount > 0 || bdCount > 0) {
      throw new ConflictException(
        `Không thể xoá lớp '${maLop}': còn ${svCount} sinh viên, ${bdCount} dòng điểm`,
      );
    }
    await this.prisma.lopHoc.delete({ where: { maLop } });
    return { message: `Đã xoá lớp '${maLop}'` };
  }

  async addStudent(maLop: string, dto: AddStudentToClassDto) {
    await this.findOne(maLop);

    const existsSV = await this.prisma.sinhVien.findUnique({ where: { maSV: dto.maSV } });
    if (existsSV) throw new ConflictException(`Mã sinh viên '${dto.maSV}' đã tồn tại`);

    return this.prisma.sinhVien.create({
      data: { maSV: dto.maSV, hoTen: dto.hoTen, maLop },
    });
  }

  async removeStudent(maLop: string, maSV: string) {
    const sv = await this.prisma.sinhVien.findUnique({ where: { maSV } });
    if (!sv) throw new NotFoundException(`Sinh viên '${maSV}' không tồn tại`);
    if (sv.maLop !== maLop) {
      throw new BadRequestException(`Sinh viên '${maSV}' không thuộc lớp '${maLop}'`);
    }

    const bdCount = await this.prisma.bangDiem.count({ where: { maSV } });
    if (bdCount > 0) {
      throw new ConflictException(
        `Không thể xoá sinh viên '${maSV}': còn ${bdCount} dòng điểm`,
      );
    }

    await this.prisma.sinhVien.delete({ where: { maSV } });
    return { message: `Đã xoá sinh viên '${maSV}' khỏi lớp '${maLop}'` };
  }
}
