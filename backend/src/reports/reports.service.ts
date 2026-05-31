import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NAM_HOC_REGEX = /^\d{4}-\d{4}$/;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // BM8.1 / SĐ8: gom DeThi theo (maMon, hocKy) trong 1 năm học
  async examsBySubject(namHoc: string, hocKy?: number) {
    this.validateNamHoc(namHoc);
    if (hocKy !== undefined) this.validateHocKy(hocKy);

    const groups = await this.prisma.deThi.groupBy({
      by: ['maMon', 'hocKy'],
      where: { namHoc, ...(hocKy !== undefined && { hocKy }) },
      _count: { maDeThi: true },
      orderBy: [{ maMon: 'asc' }, { hocKy: 'asc' }],
    });

    const monHocs = await this.prisma.monHoc.findMany({
      where: { maMon: { in: groups.map((g) => g.maMon) } },
      select: { maMon: true, tenMon: true },
    });
    const tenMonByMa = Object.fromEntries(monHocs.map((m) => [m.maMon, m.tenMon]));

    return groups.map((g) => ({
      maMon: g.maMon,
      tenMon: tenMonByMa[g.maMon] ?? '(không xác định)',
      hocKy: g.hocKy,
      soLuongDeThi: g._count.maDeThi,
    }));
  }

  // BM8.2 / SĐ8: gom BangDiem theo (Lớp, Học kỳ); đếm đạt (≥5) / rớt (<5)
  async resultsByClass(namHoc: string, hocKy?: number, maMon?: string) {
    this.validateNamHoc(namHoc);
    if (hocKy !== undefined) this.validateHocKy(hocKy);

    const grades = await this.prisma.bangDiem.findMany({
      where: {
        namHoc,
        ...(hocKy !== undefined && { hocKy }),
        ...(maMon && { lopHoc: { maMon } }),
      },
      include: {
        lopHoc: {
          select: {
            tenLop: true,
            maMon: true,
            monHoc: { select: { tenMon: true } },
            _count: { select: { sinhViens: true } },
          },
        },
      },
    });

    const buckets = new Map<
      string,
      {
        maLop: string;
        tenLop: string;
        maMon: string;
        tenMon: string;
        hocKy: number;
        siSo: number;
        soSVDiThi: number;
        soDat: number;
        diemTong: number;
      }
    >();

    for (const g of grades) {
      const key = `${g.maLop}::${g.hocKy}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          maLop: g.maLop,
          tenLop: g.lopHoc.tenLop,
          maMon: g.lopHoc.maMon,
          tenMon: g.lopHoc.monHoc.tenMon,
          hocKy: g.hocKy,
          siSo: g.lopHoc._count.sinhViens,
          soSVDiThi: 0,
          soDat: 0,
          diemTong: 0,
        };
        buckets.set(key, bucket);
      }
      bucket.soSVDiThi += 1;
      const score = Number(g.diemSo);
      bucket.diemTong += score;
      if (score >= 5) bucket.soDat += 1;
    }

    return Array.from(buckets.values())
      .sort((a, b) => (a.maLop === b.maLop ? a.hocKy - b.hocKy : a.maLop.localeCompare(b.maLop)))
      .map((b) => ({
        maLop: b.maLop,
        tenLop: b.tenLop,
        maMon: b.maMon,
        tenMon: b.tenMon,
        hocKy: b.hocKy,
        siSo: b.siSo,
        soSVDiThi: b.soSVDiThi,
        diemTrungBinh: b.soSVDiThi > 0 ? +(b.diemTong / b.soSVDiThi).toFixed(2) : 0,
        tiLeDat: b.soSVDiThi > 0 ? +(b.soDat / b.soSVDiThi).toFixed(4) : 0,
      }));
  }

  // Dashboard tổng quan: trả về 4-5 số đếm + điểm TB. Role-based.
  async overview(user: { vaiTro: string; maGV: string | null }) {
    const isAdmin = user.vaiTro === 'admin';

    if (isAdmin) {
      const [studentCount, gradeCount, teacherCount, avg] = await Promise.all([
        this.prisma.sinhVien.count(),
        this.prisma.bangDiem.count(),
        this.prisma.giangVien.count(),
        this.prisma.bangDiem.aggregate({ _avg: { diemSo: true } }),
      ]);
      return {
        role: 'admin' as const,
        studentCount,
        gradeCount,
        teacherCount,
        averageScore: avg._avg.diemSo !== null ? Number(avg._avg.diemSo) : null,
      };
    }

    // Giảng viên: chỉ thấy số liệu liên quan tới chính mình
    const maGV = user.maGV;
    if (!maGV) {
      return {
        role: 'giaovien' as const,
        studentCount: 0,
        gradeCount: 0,
        ownQuestionCount: 0,
        ownExamCount: 0,
        averageScore: null,
      };
    }
    const [studentCount, gradeCount, ownQuestionCount, ownExamCount, avg] = await Promise.all([
      this.prisma.sinhVien.count(),
      this.prisma.bangDiem.count({ where: { deThi: { maGV } } }),
      this.prisma.cauHoi.count({ where: { maGV } }),
      this.prisma.deThi.count({ where: { maGV } }),
      this.prisma.bangDiem.aggregate({
        _avg: { diemSo: true },
        where: { deThi: { maGV } },
      }),
    ]);
    return {
      role: 'giaovien' as const,
      studentCount,
      gradeCount,
      ownQuestionCount,
      ownExamCount,
      averageScore: avg._avg.diemSo !== null ? Number(avg._avg.diemSo) : null,
    };
  }

  // ----- helpers -----

  private validateNamHoc(namHoc: string) {
    if (!namHoc || !NAM_HOC_REGEX.test(namHoc)) {
      throw new BadRequestException(`Năm học '${namHoc}' không hợp lệ (cần dạng YYYY-YYYY)`);
    }
  }

  private validateHocKy(hocKy: number) {
    if (!Number.isInteger(hocKy) || hocKy < 1 || hocKy > 3) {
      throw new BadRequestException(`Học kỳ '${hocKy}' không hợp lệ (1, 2 hoặc 3)`);
    }
  }
}
