import { PrismaClient, type Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ====== HẰNG SỐ DỮ LIỆU ======

const TEACHERS = [
  { maGV: 'GV01', hoTen: 'Nguyễn Hải Thiện', email: 'thien@uit.edu.vn', user: 'gv_thien' },
  { maGV: 'GV02', hoTen: 'Lại Khánh Hoàng', email: 'hoang@uit.edu.vn', user: 'gv_hoang' },
  { maGV: 'GV03', hoTen: 'Trần Phan Thanh Tùng', email: 'tung@uit.edu.vn', user: 'gv_tung' },
  { maGV: 'GV04', hoTen: 'Phan Đức Chí Bảo', email: 'bao@uit.edu.vn', user: 'gv_bao' },
];

const SUBJECTS = [
  { maMon: 'IT001', tenMon: 'Nhập môn lập trình', soTinChi: 4 },
  { maMon: 'IT002', tenMon: 'Lập trình hướng đối tượng', soTinChi: 4 },
  { maMon: 'CS104', tenMon: 'Cấu trúc dữ liệu và giải thuật', soTinChi: 4 },
  { maMon: 'MA003', tenMon: 'Đại số tuyến tính', soTinChi: 3 },
  { maMon: 'MA006', tenMon: 'Giải tích', soTinChi: 4 },
  { maMon: 'MA004', tenMon: 'Toán rời rạc', soTinChi: 4 },
  { maMon: 'IT005', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
  { maMon: 'IT006', tenMon: 'Phân tích thiết kế hệ thống', soTinChi: 3 },
  { maMon: 'NT106', tenMon: 'Mạng máy tính', soTinChi: 4 },
  { maMon: 'SE104', tenMon: 'Nhập môn Công nghệ phần mềm', soTinChi: 4 },
];

// 10 câu / môn, mỗi câu gán độ khó theo DIFFICULTY_DIST
const QUESTION_TEMPLATES: Record<string, string[]> = {
  IT001: [
    'Biến (variable) trong lập trình là gì?',
    'Phân biệt kiểu dữ liệu int và float.',
    'Cấu trúc rẽ nhánh if-else hoạt động thế nào?',
    'Vòng lặp for và while khác nhau ra sao?',
    'Hàm (function) là gì và khi nào nên dùng?',
    'Mảng (array) trong C lưu trữ dữ liệu thế nào?',
    'Con trỏ (pointer) là gì?',
    'Cấu trúc (struct) khác mảng ở điểm nào?',
    'Đệ quy (recursion) là gì? Cho ví dụ.',
    'Phân biệt giữa stack và heap memory.',
  ],
  IT002: [
    'OOP là gì? Liệt kê bốn tính chất cơ bản.',
    'Phân biệt class và object.',
    'Inheritance (kế thừa) là gì?',
    'Polymorphism (đa hình) hoạt động thế nào?',
    'Encapsulation (đóng gói) là gì?',
    'Abstraction (trừu tượng) khác encapsulation ra sao?',
    'Phân biệt overloading và overriding.',
    'Interface và abstract class khác nhau thế nào?',
    'Constructor và destructor là gì?',
    'Khi nào dùng composition thay vì inheritance?',
  ],
  CS104: [
    'Big-O notation là gì? Cho ví dụ.',
    'Phân biệt cấu trúc Stack và Queue.',
    'Linked list khác array ở điểm nào?',
    'Binary Search Tree hoạt động thế nào?',
    'Thuật toán Quick Sort có độ phức tạp bao nhiêu?',
    'Merge Sort có ưu điểm gì so với Quick Sort?',
    'Hash Table giải quyết collision thế nào?',
    'Graph có những cách biểu diễn nào?',
    'DFS và BFS khác nhau thế nào?',
    'Dynamic Programming là gì?',
  ],
  MA003: [
    'Ma trận khả nghịch là gì?',
    'Định thức ma trận có ý nghĩa gì?',
    'Trị riêng và vector riêng là gì?',
    'Hệ phương trình tuyến tính giải bằng cách nào?',
    'Không gian vector là gì?',
    'Cơ sở (basis) của không gian vector?',
    'Phép biến đổi tuyến tính có những loại nào?',
    'Ma trận đối xứng có tính chất gì?',
    'Tích trong (inner product) là gì?',
    'Phân rã LU áp dụng khi nào?',
  ],
  MA006: [
    'Giới hạn hàm số là gì?',
    'Đạo hàm tại điểm có ý nghĩa hình học gì?',
    'Phân biệt đạo hàm và vi phân.',
    'Tích phân xác định và bất định khác nhau thế nào?',
    'Chuỗi số hội tụ là gì?',
    'Hàm liên tục có những loại bất liên tục nào?',
    'Định lý Rolle phát biểu thế nào?',
    "Quy tắc L'Hopital áp dụng khi nào?",
    'Tích phân từng phần dùng công thức gì?',
    'Phương trình vi phân cấp 1 giải bằng cách nào?',
  ],
  MA004: [
    'Logic mệnh đề là gì?',
    'Bảng chân trị dùng để làm gì?',
    'Quan hệ tương đương có tính chất gì?',
    'Hàm đơn ánh, toàn ánh, song ánh khác nhau thế nào?',
    'Quy nạp toán học là gì?',
    'Tổ hợp và chỉnh hợp khác nhau thế nào?',
    'Đồ thị Euler có điều kiện gì?',
    'Cây nhị phân đầy đủ là gì?',
    'Phép đếm dùng nguyên lý nào?',
    'Phương pháp suy diễn tự nhiên là gì?',
  ],
  IT005: [
    'CSDL quan hệ là gì?',
    'Khoá chính và khoá ngoại khác nhau thế nào?',
    'Chuẩn hoá CSDL có những dạng nào?',
    'Phép JOIN trong SQL có những loại nào?',
    'Transaction có các tính chất ACID nào?',
    'Index trong CSDL dùng để làm gì?',
    'View khác bảng thực ở điểm nào?',
    'Trigger và stored procedure khác nhau ra sao?',
    'Phân biệt NoSQL và SQL.',
    'Sharding và replication khác nhau thế nào?',
  ],
  IT006: [
    'UML là gì? Liệt kê các loại sơ đồ.',
    'Use case diagram dùng để làm gì?',
    'Class diagram thể hiện những gì?',
    'Sequence diagram khác activity diagram ra sao?',
    'Design pattern Singleton dùng khi nào?',
    'Pattern Observer giải quyết vấn đề gì?',
    'Mô hình MVC gồm những thành phần nào?',
    'Năm nguyên lý SOLID là gì?',
    'Microservices khác monolith thế nào?',
    'CI/CD viết tắt của gì và để làm gì?',
  ],
  NT106: [
    'Mô hình OSI có mấy lớp? Kể tên.',
    'TCP và UDP khác nhau thế nào?',
    'IPv4 và IPv6 khác nhau ra sao?',
    'DNS hoạt động thế nào?',
    'HTTP và HTTPS khác nhau ở điểm gì?',
    'Subnet mask dùng để làm gì?',
    'Routing và switching khác nhau thế nào?',
    'Firewall hoạt động dựa trên gì?',
    'NAT là gì? Có những loại nào?',
    'VPN dùng các giao thức nào phổ biến?',
  ],
  SE104: [
    'Mô hình thác nước (Waterfall) là gì?',
    'Agile khác Waterfall ở điểm nào?',
    'Scrum có những vai trò gì?',
    'Use case là gì?',
    'Yêu cầu chức năng vs phi chức năng khác nhau ra sao?',
    'Kiểm thử hộp đen và hộp trắng khác nhau thế nào?',
    'Unit test khác integration test ở điểm nào?',
    'Refactoring là gì?',
    'Technical debt là gì?',
    'Code review hiệu quả cần lưu ý gì?',
  ],
};

// 10 câu, mỗi câu 1 mức độ khó (1=Dễ, 2=TB, 3=Phức Tạp, 4=Khó)
const DIFFICULTY_DIST = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4];

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const DEM = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Quốc', 'Thanh', 'Hoàng', 'Khắc', 'Ngọc'];
const TEN = ['An', 'Bình', 'Cường', 'Dũng', 'Hằng', 'Hoa', 'Hùng', 'Khoa', 'Lâm', 'Linh', 'Mai', 'Nam', 'Phong', 'Quân', 'Sơn', 'Trang', 'Tú', 'Uyên', 'Vy', 'Yến', 'Anh', 'Tâm', 'Phú', 'Diệu', 'Khánh'];

function randomName(): string {
  const ho = HO[Math.floor(Math.random() * HO.length)];
  const dem = DEM[Math.floor(Math.random() * DEM.length)];
  const ten = TEN[Math.floor(Math.random() * TEN.length)];
  return `${ho} ${dem} ${ten}`;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Box-Muller — Gauss distribution
function gauss(mean: number, sigma: number): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sigma;
}

// Sinh điểm theo phân phối Gauss của môn, clamp 0-10, 1 chữ số thập phân
function scoreFor(meanScore: number, sigma: number): number {
  const raw = gauss(meanScore, sigma);
  const clamped = Math.max(0, Math.min(10, raw));
  return Math.round(clamped * 10) / 10;
}

async function main() {
  console.log('Đang dọn dẹp dữ liệu cũ (Clean DB)...');
  await prisma.chiTietDeThi.deleteMany();
  await prisma.bangDiem.deleteMany();
  await prisma.deThi.deleteMany();
  await prisma.quyDinh.deleteMany();
  await prisma.cauHoi.deleteMany();
  await prisma.sinhVien.deleteMany();
  await prisma.lopHoc.deleteMany();
  await prisma.monHoc.deleteMany();
  await prisma.doKho.deleteMany();
  await prisma.taiKhoan.deleteMany();
  await prisma.giangVien.deleteMany();

  console.log('Bắt đầu seed dữ liệu mới...');
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedTeacher = await bcrypt.hash('123456', 10);

  // 1. Admin
  const admin = await prisma.taiKhoan.create({
    data: { tenDangNhap: 'admin', matKhau: hashedAdmin, vaiTro: 'admin', trangThai: 1 },
  });
  console.log('  + 1 admin');

  // 2. 4 Giảng viên (gv_thien, gv_hoang, gv_tung, gv_bao — pass 123456)
  for (const t of TEACHERS) {
    await prisma.giangVien.create({
      data: {
        maGV: t.maGV,
        hoTen: t.hoTen,
        email: t.email,
        khoaBoMon: 'CNPM',
        taiKhoan: {
          create: { tenDangNhap: t.user, matKhau: hashedTeacher, vaiTro: 'giaovien', trangThai: 1 },
        },
      },
    });
  }
  console.log(`  + ${TEACHERS.length} giảng viên`);

  // 3. 4 Độ khó
  const difficulties = await Promise.all(
    ['Dễ', 'Trung Bình', 'Phức Tạp', 'Khó'].map((tenDoKho) =>
      prisma.doKho.create({ data: { tenDoKho } }),
    ),
  );
  console.log(`  + ${difficulties.length} độ khó`);

  // 4. 10 Môn học
  await prisma.monHoc.createMany({ data: SUBJECTS });
  console.log(`  + ${SUBJECTS.length} môn học`);

  // 5. 100 Câu hỏi (10 / môn)
  const questionData: Prisma.CauHoiCreateManyInput[] = [];
  for (const subject of SUBJECTS) {
    const templates = QUESTION_TEMPLATES[subject.maMon];
    for (let i = 0; i < templates.length; i++) {
      questionData.push({
        noiDung: templates[i],
        maMon: subject.maMon,
        maDoKho: difficulties[DIFFICULTY_DIST[i] - 1].maDoKho,
        maGV: TEACHERS[i % TEACHERS.length].maGV,
      });
    }
  }
  await prisma.cauHoi.createMany({ data: questionData });
  console.log(`  + ${questionData.length} câu hỏi`);

  // 6. 10 Lớp học (1 lớp / môn) + SV (random 10-22 / lớp) — kích cỡ lớp lệch
  const classes: { maLop: string; maMon: string; sinhVienIds: string[] }[] = [];
  let sttSv = 23520001;
  for (let i = 0; i < SUBJECTS.length; i++) {
    const subject = SUBJECTS[i];
    const groupCode = `O${20 + i}`;
    const maLop = `${subject.maMon}.${groupCode}`;
    const tenLop = `${subject.maMon} - ${groupCode}`;
    const classSize = randInt(10, 22);
    const svs: { maSV: string; hoTen: string }[] = [];
    for (let j = 0; j < classSize; j++) {
      svs.push({ maSV: String(sttSv++), hoTen: randomName() });
    }
    await prisma.lopHoc.create({
      data: {
        maLop,
        tenLop,
        maMon: subject.maMon,
        sinhViens: { create: svs },
      },
    });
    classes.push({ maLop, maMon: subject.maMon, sinhVienIds: svs.map((s) => s.maSV) });
  }
  console.log(`  + ${classes.length} lớp, ${classes.reduce((s, c) => s + c.sinhVienIds.length, 0)} sinh viên`);

  // 7. Đề thi (random 1-4 đề / môn, rải 2 năm × 2 HK ngẫu nhiên) — biểu đồ lệch
  const examInfoById: Record<number, { maMon: string; hocKy: number; namHoc: string }> = {};
  const examIdsByMon: Record<string, number[]> = {};
  const YEARS = ['2024-2025', '2025-2026'];
  for (const subject of SUBJECTS) {
    const questionsOfSubject = await prisma.cauHoi.findMany({
      where: { maMon: subject.maMon },
      select: { maCauHoi: true },
    });
    if (questionsOfSubject.length < 5) continue;

    const examCount = randInt(1, 4);
    for (let k = 0; k < examCount; k++) {
      const picked = pickRandom(questionsOfSubject, 5);
      const gv = TEACHERS[Math.floor(Math.random() * TEACHERS.length)].maGV;
      const thoiLuong = [60, 75, 90, 120][Math.floor(Math.random() * 4)];
      const namHoc = YEARS[Math.floor(Math.random() * YEARS.length)];
      const hocKy = Math.random() < 0.5 ? 1 : 2;

      const exam = await prisma.deThi.create({
        data: {
          hocKy,
          namHoc,
          thoiLuong,
          maMon: subject.maMon,
          maGV: gv,
          chiTietDeThis: {
            create: picked.map((q, idx) => ({ maCauHoi: q.maCauHoi, soCau: idx + 1 })),
          },
        },
      });
      examInfoById[exam.maDeThi] = { maMon: subject.maMon, hocKy, namHoc };
      examIdsByMon[subject.maMon] = examIdsByMon[subject.maMon] ?? [];
      examIdsByMon[subject.maMon].push(exam.maDeThi);
    }
  }
  const totalExams = Object.values(examIdsByMon).reduce((s, a) => s + a.length, 0);
  console.log(`  + ${totalExams} đề thi (random 1-4 / môn)`);

  // 8. Bảng điểm: tỉ lệ nhập + điểm TB lệch theo môn (Gauss per-môn)
  //   - Mỗi môn có mean (5.5-8.5) và sigma (1.0-1.8): môn "dễ" mean cao, môn "khó" mean thấp
  //   - Tỉ lệ SV được nhập điểm random 50-95% mỗi lớp/đề
  const subjectStat: Record<string, { mean: number; sigma: number }> = {};
  for (const s of SUBJECTS) {
    subjectStat[s.maMon] = { mean: randFloat(5.5, 8.5), sigma: randFloat(1.0, 1.8) };
  }

  const gradeData: Prisma.BangDiemCreateManyInput[] = [];
  for (const cls of classes) {
    const examIds = examIdsByMon[cls.maMon] ?? [];
    const stat = subjectStat[cls.maMon];
    for (const maDeThi of examIds) {
      const exam = examInfoById[maDeThi];
      if (!exam) continue;
      const fillRate = randFloat(0.5, 0.95);
      const svToGrade = cls.sinhVienIds.filter(() => Math.random() < fillRate);
      for (const maSV of svToGrade) {
        gradeData.push({
          maSV,
          maLop: cls.maLop,
          maDeThi,
          hocKy: exam.hocKy,
          namHoc: exam.namHoc,
          diemSo: scoreFor(stat.mean, stat.sigma),
          ghiChu: null,
        });
      }
    }
  }
  await prisma.bangDiem.createMany({ data: gradeData });
  console.log(`  + ${gradeData.length} bảng điểm (mean/sigma lệch theo môn)`);

  // 9. 5 Quy định (đọc qua RuleEngineService)
  await prisma.quyDinh.createMany({
    data: [
      { tenThamSo: 'SoCauToiDa', giaTri: '5', moTa: 'Số câu hỏi tối đa trong 1 đề thi', maTKCapNhat: admin.maTK },
      { tenThamSo: 'ThoiLuongMin', giaTri: '30', moTa: 'Thời lượng thi tối thiểu (phút)', maTKCapNhat: admin.maTK },
      { tenThamSo: 'ThoiLuongMax', giaTri: '180', moTa: 'Thời lượng thi tối đa (phút)', maTKCapNhat: admin.maTK },
      { tenThamSo: 'DiemMin', giaTri: '0', moTa: 'Điểm số tối thiểu', maTKCapNhat: admin.maTK },
      { tenThamSo: 'DiemMax', giaTri: '10', moTa: 'Điểm số tối đa', maTKCapNhat: admin.maTK },
    ],
  });
  console.log('  + 5 quy định');

  console.log('\nHoàn thành seed dữ liệu mẫu!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
