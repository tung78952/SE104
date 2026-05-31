import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEngineService } from '../regulations/rule-engine.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateGradesBatchDto, GradeEntryDto } from './dto/create-grades-batch.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  // BM5 / SĐ5: B4 SV thuộc lớp, B5 điểm trong [DiemMin, DiemMax] + lớp-đề cùng môn
  async create(dto: CreateGradeDto) {
    await this.validateContext(dto.maLop, dto.maDeThi);
    await this.validateStudentInClass(dto.maSV, dto.maLop);
    await this.validateScore(dto.diemSo);

    const dup = await this.prisma.bangDiem.findFirst({
      where: {
        maSV: dto.maSV,
        maDeThi: dto.maDeThi,
        hocKy: dto.hocKy,
        namHoc: dto.namHoc,
      },
    });
    if (dup) {
      throw new ConflictException(
        `Sinh viên '${dto.maSV}' đã có điểm cho đề thi '${dto.maDeThi}' (HK${dto.hocKy} ${dto.namHoc}). Dùng PATCH để cập nhật.`,
      );
    }

    return this.prisma.bangDiem.create({
      data: {
        hocKy: dto.hocKy,
        namHoc: dto.namHoc,
        diemSo: dto.diemSo,
        ghiChu: dto.ghiChu,
        maSV: dto.maSV,
        maLop: dto.maLop,
        maDeThi: dto.maDeThi,
      },
      include: {
        sinhVien: { select: { hoTen: true } },
        deThi: { select: { hocKy: true, namHoc: true, maMon: true } },
      },
    });
  }

  // BM5 — ghi nhận cả lớp 1 lần. Upsert theo (maSV + maDeThi + hocKy + namHoc).
  async createBatch(dto: CreateGradesBatchDto) {
    const lop = await this.validateContext(dto.maLop, dto.maDeThi);

    // SV trùng trong danh sách
    const seen = new Set<string>();
    for (const e of dto.danhSachDiem) {
      if (seen.has(e.maSV)) {
        throw new BadRequestException(`Sinh viên '${e.maSV}' trùng trong danh sách điểm`);
      }
      seen.add(e.maSV);
    }

    // SV thuộc lớp (SĐ5-B4)
    const svInClass = new Set(lop.sinhViens.map((sv) => sv.maSV));
    for (const e of dto.danhSachDiem) {
      if (!svInClass.has(e.maSV)) {
        throw new BadRequestException(
          `Sinh viên '${e.maSV}' không thuộc lớp '${dto.maLop}'`,
        );
      }
    }

    // Điểm trong range (SĐ5-B5)
    const [diemMin, diemMax] = await this.getScoreRange();
    for (const e of dto.danhSachDiem) {
      if (e.diemSo < diemMin || e.diemSo > diemMax) {
        throw new BadRequestException(
          `Điểm của SV '${e.maSV}' (${e.diemSo}) ngoài khoảng [${diemMin}, ${diemMax}]`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const results = [] as Awaited<ReturnType<typeof tx.bangDiem.create>>[];
      for (const e of dto.danhSachDiem) {
        const existing = await tx.bangDiem.findFirst({
          where: {
            maSV: e.maSV,
            maDeThi: dto.maDeThi,
            hocKy: dto.hocKy,
            namHoc: dto.namHoc,
          },
        });
        const row = existing
          ? await tx.bangDiem.update({
              where: { maBangDiem: existing.maBangDiem },
              data: { diemSo: e.diemSo, ghiChu: e.ghiChu },
            })
          : await tx.bangDiem.create({
              data: {
                hocKy: dto.hocKy,
                namHoc: dto.namHoc,
                diemSo: e.diemSo,
                ghiChu: e.ghiChu,
                maSV: e.maSV,
                maLop: dto.maLop,
                maDeThi: dto.maDeThi,
              },
            });
        results.push(row);
      }
      return { count: results.length, data: results };
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    maLop?: string,
    maDeThi?: number,
    hocKy?: number,
    namHoc?: string,
  ) {
    const where: any = {};
    if (maLop) where.maLop = maLop;
    if (maDeThi) where.maDeThi = maDeThi;
    if (hocKy) where.hocKy = hocKy;
    if (namHoc) where.namHoc = namHoc;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.bangDiem.findMany({
        where,
        skip,
        take: limit,
        include: {
          sinhVien: { select: { hoTen: true } },
          lopHoc: { select: { tenLop: true, maMon: true } },
          deThi: { select: { hocKy: true, namHoc: true, maMon: true } },
        },
        orderBy: [{ maLop: 'asc' }, { maSV: 'asc' }],
      }),
      this.prisma.bangDiem.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(maBangDiem: number) {
    const row = await this.prisma.bangDiem.findUnique({
      where: { maBangDiem },
      include: {
        sinhVien: { select: { hoTen: true, maLop: true } },
        lopHoc: { select: { tenLop: true, maMon: true } },
        deThi: { select: { hocKy: true, namHoc: true, maMon: true, thoiLuong: true } },
      },
    });
    if (!row) throw new NotFoundException(`Dòng điểm '${maBangDiem}' không tồn tại`);
    return row;
  }

  async update(maBangDiem: number, dto: UpdateGradeDto) {
    await this.findOne(maBangDiem);
    if (dto.diemSo !== undefined) await this.validateScore(dto.diemSo);

    return this.prisma.bangDiem.update({
      where: { maBangDiem },
      data: dto,
      include: {
        sinhVien: { select: { hoTen: true } },
        deThi: { select: { hocKy: true, namHoc: true, maMon: true } },
      },
    });
  }

  // Theo bảng phân quyền 1.5.2, không có quyền xoá bảng điểm.
  // Trường hợp đặc biệt cần can thiệp trực tiếp database.

  // ----- helpers -----

  // Validate maLop + maDeThi tồn tại, và môn của lớp = môn của đề thi (BAO_CAO QĐ5)
  private async validateContext(maLop: string, maDeThi: number) {
    const [lop, exam] = await Promise.all([
      this.prisma.lopHoc.findUnique({
        where: { maLop },
        include: { sinhViens: { select: { maSV: true } } },
      }),
      this.prisma.deThi.findUnique({ where: { maDeThi } }),
    ]);
    if (!lop) throw new NotFoundException(`Lớp '${maLop}' không tồn tại`);
    if (!exam) throw new NotFoundException(`Đề thi '${maDeThi}' không tồn tại`);
    if (lop.maMon !== exam.maMon) {
      throw new BadRequestException(
        `Môn của đề thi ('${exam.maMon}') không khớp với môn của lớp ('${lop.maMon}')`,
      );
    }
    return lop;
  }

  private async validateStudentInClass(maSV: string, maLop: string) {
    const sv = await this.prisma.sinhVien.findUnique({ where: { maSV } });
    if (!sv) throw new NotFoundException(`Sinh viên '${maSV}' không tồn tại`);
    if (sv.maLop !== maLop) {
      throw new BadRequestException(`Sinh viên '${maSV}' không thuộc lớp '${maLop}'`);
    }
  }

  private async validateScore(diemSo: number) {
    const [diemMin, diemMax] = await this.getScoreRange();
    if (diemSo < diemMin || diemSo > diemMax) {
      throw new BadRequestException(
        `Điểm số (${diemSo}) phải trong khoảng [${diemMin}, ${diemMax}]`,
      );
    }
  }

  private async getScoreRange(): Promise<[number, number]> {
    return Promise.all([
      this.ruleEngine.getNumber('DiemMin', 0),
      this.ruleEngine.getNumber('DiemMax', 10),
    ]) as Promise<[number, number]>;
  }
}
