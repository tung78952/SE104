import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

interface CurrentUser {
  maGV?: string | null;
}

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // SĐ1: B4 validate maMon, B5 validate maDoKho, B6 noiDung không rỗng (DTO), B7 lưu
  async create(dto: CreateQuestionDto, maGV: string) {
    await this.validateForeignKeys(dto.maMon, dto.maDoKho);

    return this.prisma.cauHoi.create({
      data: {
        noiDung: dto.noiDung,
        maMon: dto.maMon,
        maDoKho: dto.maDoKho,
        maGV,
      },
      include: {
        monHoc: { select: { tenMon: true } },
        doKho: { select: { tenDoKho: true } },
        giangVien: { select: { hoTen: true } },
      },
    });
  }

  // SĐ6 (BM6): lọc theo maMon, maDoKho, keyword + phân trang
  async findAll(
    page: number = 1,
    limit: number = 10,
    maMon?: string,
    maDoKho?: number,
    keyword?: string,
  ) {
    const where: any = {};
    if (maMon) where.maMon = maMon;
    if (maDoKho) where.maDoKho = maDoKho;
    if (keyword) where.noiDung = { contains: keyword };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.cauHoi.findMany({
        where,
        skip,
        take: limit,
        include: {
          monHoc: { select: { tenMon: true } },
          doKho: { select: { tenDoKho: true } },
          giangVien: { select: { hoTen: true } },
        },
        orderBy: { ngayTao: 'desc' },
      }),
      this.prisma.cauHoi.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(maCauHoi: number) {
    const question = await this.prisma.cauHoi.findUnique({
      where: { maCauHoi },
      include: {
        monHoc: { select: { tenMon: true } },
        doKho: { select: { tenDoKho: true } },
        giangVien: { select: { hoTen: true, email: true } },
      },
    });
    if (!question) throw new NotFoundException(`Câu hỏi '${maCauHoi}' không tồn tại`);
    return question;
  }

  async update(maCauHoi: number, dto: UpdateQuestionDto, currentUser: CurrentUser) {
    const question = await this.findOne(maCauHoi);
    this.assertOwner(question.maGV, currentUser);

    if (dto.maMon !== undefined || dto.maDoKho !== undefined) {
      await this.validateForeignKeys(
        dto.maMon ?? question.maMon,
        dto.maDoKho ?? question.maDoKho,
      );
    }

    return this.prisma.cauHoi.update({
      where: { maCauHoi },
      data: dto,
      include: {
        monHoc: { select: { tenMon: true } },
        doKho: { select: { tenDoKho: true } },
        giangVien: { select: { hoTen: true } },
      },
    });
  }

  async remove(maCauHoi: number, currentUser: CurrentUser) {
    const question = await this.findOne(maCauHoi);
    this.assertOwner(question.maGV, currentUser);

    // Câu hỏi đang nằm trong đề thi nào không? — chặn xoá để không phá đề thi đã chốt
    const usedCount = await this.prisma.chiTietDeThi.count({ where: { maCauHoi } });
    if (usedCount > 0) {
      throw new ConflictException(
        `Không thể xoá câu hỏi '${maCauHoi}': đang nằm trong ${usedCount} đề thi`,
      );
    }

    await this.prisma.cauHoi.delete({ where: { maCauHoi } });
    return { message: `Đã xoá câu hỏi '${maCauHoi}'` };
  }

  // ----- helpers -----

  private async validateForeignKeys(maMon: string, maDoKho: number) {
    const [mon, doKho] = await Promise.all([
      this.prisma.monHoc.findUnique({ where: { maMon } }),
      this.prisma.doKho.findUnique({ where: { maDoKho } }),
    ]);
    if (!mon) throw new NotFoundException(`Môn học '${maMon}' không tồn tại`);
    if (!doKho) throw new NotFoundException(`Độ khó '${maDoKho}' không tồn tại`);
  }

  // §1.5.2: Quản lý câu hỏi — Admin không có quyền Sửa/Xoá (chặn ở controller)
  private assertOwner(ownerMaGV: string, currentUser: CurrentUser) {
    if (currentUser.maGV && currentUser.maGV === ownerMaGV) return;
    throw new ForbiddenException(
      'Chỉ giảng viên đã soạn câu hỏi này mới được sửa/xoá',
    );
  }
}
