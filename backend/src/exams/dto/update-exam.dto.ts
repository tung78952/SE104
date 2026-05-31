import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  hocKy?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'Năm học phải có dạng YYYY-YYYY (ví dụ 2025-2026)' })
  namHoc?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  thoiLuong?: number;

  // Cho phép thay danh sách câu hỏi (sẽ replace toàn bộ ChiTietDeThi trong transaction)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  danhSachMaCauHoi?: number[];
}
