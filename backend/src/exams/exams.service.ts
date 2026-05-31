import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEngineService } from '../regulations/rule-engine.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

interface CurrentUser {
  maGV?: string | null;
}

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  // BM2 / SĐ2: B4 maMon, B5 số câu, B6 cùng môn, B7 thời lượng — sau đó B8 lưu trong transaction
  async create(dto: CreateExamDto, maGV: string) {
    const monHoc = await this.prisma.monHoc.findUnique({ where: { maMon: dto.maMon } });
    if (!monHoc) throw new NotFoundException(`Môn học '${dto.maMon}' không tồn tại`);

    await this.validateQuestionList(dto.danhSachMaCauHoi, dto.maMon);
    await this.validateThoiLuong(dto.thoiLuong);

    return this.prisma.$transaction(async (tx) => {
      const deThi = await tx.deThi.create({
        data: {
          hocKy: dto.hocKy,
          namHoc: dto.namHoc,
          thoiLuong: dto.thoiLuong,
          maMon: dto.maMon,
          maGV,
        },
      });
      await tx.chiTietDeThi.createMany({
        data: dto.danhSachMaCauHoi.map((maCauHoi, i) => ({
          maDeThi: deThi.maDeThi,
          maCauHoi,
          soCau: i + 1,
        })),
      });
      return tx.deThi.findUnique({
        where: { maDeThi: deThi.maDeThi },
        include: {
          monHoc: { select: { tenMon: true } },
          giangVien: { select: { hoTen: true } },
          chiTietDeThis: {
            orderBy: { soCau: 'asc' },
            include: { cauHoi: { include: { doKho: { select: { tenDoKho: true } } } } },
          },
        },
      });
    });
  }

  // BM7 / SĐ7: filter ?maMon=&hocKy=&namHoc=&page=&limit=, kèm soLuongCau
  async findAll(
    page: number = 1,
    limit: number = 10,
    maMon?: string,
    hocKy?: number,
    namHoc?: string,
  ) {
    const where: any = {};
    if (maMon) where.maMon = maMon;
    if (hocKy) where.hocKy = hocKy;
    if (namHoc) where.namHoc = namHoc;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.deThi.findMany({
        where,
        skip,
        take: limit,
        include: {
          monHoc: { select: { tenMon: true } },
          giangVien: { select: { hoTen: true } },
          _count: { select: { chiTietDeThis: true } },
        },
        orderBy: { ngayTao: 'desc' },
      }),
      this.prisma.deThi.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(maDeThi: number) {
    const exam = await this.prisma.deThi.findUnique({
      where: { maDeThi },
      include: {
        monHoc: true,
        giangVien: { select: { maGV: true, hoTen: true, email: true } },
        chiTietDeThis: {
          orderBy: { soCau: 'asc' },
          include: {
            cauHoi: {
              include: {
                doKho: { select: { tenDoKho: true } },
              },
            },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException(`Đề thi '${maDeThi}' không tồn tại`);
    return exam;
  }

  async update(maDeThi: number, dto: UpdateExamDto, currentUser: CurrentUser) {
    const exam = await this.findOne(maDeThi);
    this.assertOwner(exam.maGV, currentUser);

    if (dto.thoiLuong !== undefined) {
      await this.validateThoiLuong(dto.thoiLuong);
    }

    if (dto.danhSachMaCauHoi !== undefined) {
      // Thay danh sách câu hỏi chỉ được phép khi chưa có điểm nào tham chiếu
      const bdCount = await this.prisma.bangDiem.count({ where: { maDeThi } });
      if (bdCount > 0) {
        throw new ConflictException(
          `Không thể sửa danh sách câu hỏi: đã có ${bdCount} dòng điểm tham chiếu đề thi này`,
        );
      }
      await this.validateQuestionList(dto.danhSachMaCauHoi, exam.maMon);
    }

    return this.prisma.$transaction(async (tx) => {
      const { danhSachMaCauHoi, ...metaData } = dto;
      const updated = await tx.deThi.update({
        where: { maDeThi },
        data: metaData,
      });

      if (danhSachMaCauHoi !== undefined) {
        await tx.chiTietDeThi.deleteMany({ where: { maDeThi } });
        await tx.chiTietDeThi.createMany({
          data: danhSachMaCauHoi.map((maCauHoi, i) => ({
            maDeThi,
            maCauHoi,
            soCau: i + 1,
          })),
        });
      }

      return tx.deThi.findUnique({
        where: { maDeThi: updated.maDeThi },
        include: {
          monHoc: { select: { tenMon: true } },
          giangVien: { select: { hoTen: true } },
          chiTietDeThis: {
            orderBy: { soCau: 'asc' },
            include: { cauHoi: { include: { doKho: { select: { tenDoKho: true } } } } },
          },
        },
      });
    });
  }

  async remove(maDeThi: number, currentUser: CurrentUser) {
    const exam = await this.findOne(maDeThi);
    this.assertOwner(exam.maGV, currentUser);

    // BangDiem.deThi không có cascade → phải chặn xoá để không vi phạm FK
    const bdCount = await this.prisma.bangDiem.count({ where: { maDeThi } });
    if (bdCount > 0) {
      throw new ConflictException(
        `Không thể xoá đề thi '${maDeThi}': còn ${bdCount} dòng điểm tham chiếu`,
      );
    }

    // ChiTietDeThi có onDelete: Cascade trong schema → auto xoá
    await this.prisma.deThi.delete({ where: { maDeThi } });
    return { message: `Đã xoá đề thi '${maDeThi}'` };
  }

  // ----- helpers -----

  // SĐ2-B5 + B6
  private async validateQuestionList(danhSachMaCauHoi: number[], maMon: string) {
    // Không cho phép câu trùng trong cùng đề
    const uniqueIds = new Set(danhSachMaCauHoi);
    if (uniqueIds.size !== danhSachMaCauHoi.length) {
      throw new BadRequestException('Danh sách câu hỏi có câu trùng lặp');
    }

    const soCauMax = await this.ruleEngine.getNumber('SoCauToiDa', 5);
    if (danhSachMaCauHoi.length > soCauMax) {
      throw new BadRequestException(
        `Số câu hỏi (${danhSachMaCauHoi.length}) vượt quá quy định: tối đa ${soCauMax} câu/đề`,
      );
    }

    const questions = await this.prisma.cauHoi.findMany({
      where: { maCauHoi: { in: danhSachMaCauHoi } },
      select: { maCauHoi: true, maMon: true },
    });
    if (questions.length !== danhSachMaCauHoi.length) {
      const found = new Set(questions.map((q) => q.maCauHoi));
      const missing = danhSachMaCauHoi.filter((id) => !found.has(id));
      throw new BadRequestException(
        `Câu hỏi không tồn tại: ${missing.join(', ')}`,
      );
    }
    const wrongSubject = questions.find((q) => q.maMon !== maMon);
    if (wrongSubject) {
      throw new BadRequestException(
        `Câu hỏi '${wrongSubject.maCauHoi}' không thuộc môn '${maMon}'`,
      );
    }
  }

  // SĐ2-B7
  private async validateThoiLuong(thoiLuong: number) {
    const [tlMin, tlMax] = await Promise.all([
      this.ruleEngine.getNumber('ThoiLuongMin', 30),
      this.ruleEngine.getNumber('ThoiLuongMax', 180),
    ]);
    if (thoiLuong < tlMin || thoiLuong > tlMax) {
      throw new BadRequestException(
        `Thời lượng (${thoiLuong}) phải trong khoảng [${tlMin}, ${tlMax}] phút`,
      );
    }
  }

  // §1.5.2: Quản lý đề thi — Admin không có quyền Sửa/Xoá (chặn ở controller)
  private assertOwner(ownerMaGV: string, currentUser: CurrentUser) {
    if (currentUser.maGV && currentUser.maGV === ownerMaGV) return;
    throw new ForbiddenException(
      'Chỉ giảng viên đã tạo đề thi này mới được sửa/xoá',
    );
  }
}
