import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';
import { UpdateDifficultyDto } from './dto/update-difficulty.dto';

@Injectable()
export class DifficultiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.doKho.findMany({ orderBy: { maDoKho: 'asc' } });
  }

  async findOne(maDoKho: number) {
    const doKho = await this.prisma.doKho.findUnique({ where: { maDoKho } });
    if (!doKho) throw new NotFoundException(`Độ khó '${maDoKho}' không tồn tại`);
    return doKho;
  }

  async create(dto: CreateDifficultyDto) {
    const exists = await this.prisma.doKho.findUnique({ where: { tenDoKho: dto.tenDoKho } });
    if (exists) throw new ConflictException(`Độ khó '${dto.tenDoKho}' đã tồn tại`);
    return this.prisma.doKho.create({ data: dto });
  }

  async update(maDoKho: number, dto: UpdateDifficultyDto) {
    await this.findOne(maDoKho);
    if (dto.tenDoKho) {
      const dup = await this.prisma.doKho.findUnique({ where: { tenDoKho: dto.tenDoKho } });
      if (dup && dup.maDoKho !== maDoKho) {
        throw new ConflictException(`Độ khó '${dto.tenDoKho}' đã tồn tại`);
      }
    }
    return this.prisma.doKho.update({ where: { maDoKho }, data: dto });
  }

  async remove(maDoKho: number) {
    await this.findOne(maDoKho);
    const cauHoiCount = await this.prisma.cauHoi.count({ where: { maDoKho } });
    if (cauHoiCount > 0) {
      throw new ConflictException(
        `Không thể xoá độ khó: còn ${cauHoiCount} câu hỏi đang tham chiếu`,
      );
    }
    await this.prisma.doKho.delete({ where: { maDoKho } });
    return { message: `Đã xoá độ khó '${maDoKho}'` };
  }
}
