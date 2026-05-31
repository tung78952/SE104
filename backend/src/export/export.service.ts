import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Font Unicode cho PDF + DOCX. Dùng Lora (Google Fonts, OFL — open source, free)
 * — hỗ trợ tiếng Việt đầy đủ, kiểu serif đẹp, hợp đề thi.
 * File TTF được copy từ npm package `@expo-google-fonts/lora` sang `backend/assets/fonts/`.
 * Nếu thiếu file, PDFKit fallback Helvetica và tiếng Việt sẽ ra '?'.
 */
const FONT_DIR = join(process.cwd(), 'assets', 'fonts');
const FONT_REGULAR = join(FONT_DIR, 'Lora-Regular.ttf');
const FONT_BOLD = join(FONT_DIR, 'Lora-Bold.ttf');

const TRUONG = 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN';
const DOCX_FONT_NAME = 'Lora';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async examPdf(maDeThi: number): Promise<Buffer> {
    const exam = await this.loadExam(maDeThi);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const hasVnFont = this.registerVietnameseFont(doc);
    const fontRegular = hasVnFont ? 'VN' : 'Helvetica';
    const fontBold = hasVnFont ? 'VN-Bold' : 'Helvetica-Bold';

    // Header trường
    doc.font(fontBold).fontSize(14).text(TRUONG, { align: 'center' });
    doc.moveDown(1);

    // Title đề thi (dynamic theo dữ liệu đề)
    doc
      .font(fontBold)
      .fontSize(16)
      .text(`ĐỀ THI HỌC KỲ ${exam.hocKy} (${exam.namHoc})`, { align: 'center' });
    doc.moveDown(0.8);

    // Info môn/thời gian/giảng viên
    doc.font(fontRegular).fontSize(12);
    doc.text(`Môn: ${exam.monHoc.tenMon}        Thời gian: ${exam.thoiLuong} phút`);
    doc.text(`Giảng viên: ${exam.giangVien.hoTen}`);
    doc.moveDown(0.5);

    // Đường kẻ ngang
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // Danh sách câu hỏi
    for (const ct of exam.chiTietDeThis) {
      doc
        .font(fontBold)
        .fontSize(12)
        .text(`Câu ${ct.soCau}: `, { continued: true })
        .font(fontRegular)
        .text(ct.cauHoi.noiDung);
      doc
        .font(fontRegular)
        .fontSize(10)
        .fillColor('#666666')
        .text(`   (Độ khó: ${ct.cauHoi.doKho.tenDoKho})`);
      doc.fillColor('black').fontSize(12).moveDown(0.5);
    }

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  async examDocx(maDeThi: number): Promise<Buffer> {
    const exam = await this.loadExam(maDeThi);

    // Helper: tạo TextRun với font Times New Roman
    const tr = (
      text: string,
      opts: { bold?: boolean; italics?: boolean; size?: number } = {},
    ) =>
      new TextRun({
        text,
        font: DOCX_FONT_NAME,
        size: opts.size ?? 24, // 12pt (half-points)
        bold: opts.bold,
        italics: opts.italics,
      });

    const headerParas = [
      // TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN (center, bold 14pt)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [tr(TRUONG, { bold: true, size: 28 })],
      }),
      new Paragraph({ children: [tr('')] }),
      // ĐỀ THI HỌC KỲ X (YYYY-YYYY) (center, bold 16pt)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          tr(`ĐỀ THI HỌC KỲ ${exam.hocKy} (${exam.namHoc})`, { bold: true, size: 32 }),
        ],
      }),
      new Paragraph({ children: [tr('')] }),
      new Paragraph({
        children: [tr(`Môn: ${exam.monHoc.tenMon}        Thời gian: ${exam.thoiLuong} phút`)],
      }),
      new Paragraph({
        children: [tr(`Giảng viên: ${exam.giangVien.hoTen}`)],
      }),
      new Paragraph({ children: [tr('')] }),
    ];

    const questionParas = exam.chiTietDeThis.flatMap((ct) => [
      new Paragraph({
        children: [
          tr(`Câu ${ct.soCau}: `, { bold: true }),
          tr(ct.cauHoi.noiDung),
        ],
      }),
      new Paragraph({
        children: [tr(`   (Độ khó: ${ct.cauHoi.doKho.tenDoKho})`, { italics: true, size: 20 })],
      }),
      new Paragraph({ children: [tr('')] }),
    ]);

    const doc = new Document({
      sections: [{ children: [...headerParas, ...questionParas] }],
    });

    return Packer.toBuffer(doc);
  }

  async gradesPdf(maLop: string, maDeThi: number): Promise<Buffer> {
    const [lop, exam] = await Promise.all([
      this.prisma.lopHoc.findUnique({
        where: { maLop },
        include: { monHoc: { select: { tenMon: true } } },
      }),
      this.prisma.deThi.findUnique({ where: { maDeThi } }),
    ]);
    if (!lop) throw new NotFoundException(`Lớp '${maLop}' không tồn tại`);
    if (!exam) throw new NotFoundException(`Đề thi '${maDeThi}' không tồn tại`);

    const grades = await this.prisma.bangDiem.findMany({
      where: { maLop, maDeThi },
      include: { sinhVien: { select: { hoTen: true } } },
      orderBy: { maSV: 'asc' },
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const hasVnFont = this.registerVietnameseFont(doc);
    const fontRegular = hasVnFont ? 'VN' : 'Helvetica';
    const fontBold = hasVnFont ? 'VN-Bold' : 'Helvetica-Bold';

    // Header
    doc.font(fontBold).fontSize(14).text(TRUONG, { align: 'center' });
    doc.moveDown(0.5);
    doc.font(fontBold).fontSize(16).text('BẢNG ĐIỂM', { align: 'center' });
    doc.moveDown(0.5);

    // Info
    doc.font(fontRegular).fontSize(12);
    doc.text(`Lớp: ${lop.tenLop} (${lop.maLop})`);
    doc.text(`Môn: ${lop.monHoc.tenMon}`);
    doc.text(`Đề thi: DT-${maDeThi}        Học kỳ ${exam.hocKy} – Năm học ${exam.namHoc}`);
    doc.moveDown(0.8);

    // Bảng với border
    const startX = 50;
    const colWidths = [40, 90, 200, 60, 105]; // STT | Mã SV | Họ tên | Điểm | Ghi chú = 495
    const rowH = 22;
    const padX = 4;
    const padY = 6;

    const drawRow = (cells: string[], y: number, isHeader = false) => {
      let x = startX;
      doc.font(isHeader ? fontBold : fontRegular).fontSize(11);
      for (let i = 0; i < cells.length; i++) {
        doc.rect(x, y, colWidths[i], rowH).stroke();
        doc.text(cells[i], x + padX, y + padY, {
          width: colWidths[i] - padX * 2,
          height: rowH - padY,
          lineBreak: false,
          ellipsis: true,
        });
        x += colWidths[i];
      }
    };

    let curY = doc.y;
    drawRow(['STT', 'Mã SV', 'Họ tên', 'Điểm', 'Ghi chú'], curY, true);
    curY += rowH;

    if (grades.length === 0) {
      doc.font(fontRegular).fontSize(11).text('(Chưa có sinh viên nào được nhập điểm)', startX, curY + padY);
    } else {
      grades.forEach((g, i) => {
        drawRow(
          [
            String(i + 1),
            g.maSV,
            g.sinhVien.hoTen || '',
            Number(g.diemSo).toFixed(1),
            g.ghiChu ?? '',
          ],
          curY,
        );
        curY += rowH;
      });
    }

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  // ----- helpers -----

  private async loadExam(maDeThi: number) {
    const exam = await this.prisma.deThi.findUnique({
      where: { maDeThi },
      include: {
        monHoc: true,
        giangVien: { select: { hoTen: true } },
        chiTietDeThis: {
          orderBy: { soCau: 'asc' },
          include: { cauHoi: { include: { doKho: { select: { tenDoKho: true } } } } },
        },
      },
    });
    if (!exam) throw new NotFoundException(`Đề thi '${maDeThi}' không tồn tại`);
    return exam;
  }

  private registerVietnameseFont(doc: PDFKit.PDFDocument): boolean {
    if (existsSync(FONT_REGULAR) && existsSync(FONT_BOLD)) {
      doc.registerFont('VN', FONT_REGULAR);
      doc.registerFont('VN-Bold', FONT_BOLD);
      return true;
    }
    return false;
  }
}
