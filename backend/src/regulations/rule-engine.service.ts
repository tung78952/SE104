import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Đọc tham số nghiệp vụ từ bảng QUYDINH (KHÔNG hard-code).
 * Các module khác inject service này để đọc động: SoCauToiDa, ThoiLuongMin/Max, DiemMin/Max...
 * Có cache trong RAM với TTL 60s để giảm tải DB.
 */
@Injectable()
export class RuleEngineService {
  private readonly cache = new Map<string, { value: string; expiresAt: number }>();
  private readonly TTL = 60_000; // 60 giây

  constructor(private readonly prisma: PrismaService) {}

  async get(tenThamSo: string, defaultValue?: string): Promise<string> {
    const cached = this.cache.get(tenThamSo);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const record = await this.prisma.quyDinh.findUnique({ where: { tenThamSo } });
    const value = record?.giaTri ?? defaultValue;
    if (value === undefined) {
      throw new InternalServerErrorException(`Quy định '${tenThamSo}' không tồn tại trong hệ thống`);
    }

    this.cache.set(tenThamSo, { value, expiresAt: Date.now() + this.TTL });
    return value;
  }

  async getNumber(tenThamSo: string, defaultValue?: number): Promise<number> {
    const value = await this.get(tenThamSo, defaultValue?.toString());
    const n = Number(value);
    if (Number.isNaN(n)) {
      throw new InternalServerErrorException(`Quy định '${tenThamSo}' có giá trị '${value}' không phải số`);
    }
    return n;
  }

  invalidate(tenThamSo?: string): void {
    if (tenThamSo) this.cache.delete(tenThamSo);
    else this.cache.clear();
  }
}
