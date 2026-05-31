import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateExamDto {
  @IsInt()
  @Min(1)
  @Max(3)
  hocKy: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{4}$/, { message: 'Năm học phải có dạng YYYY-YYYY (ví dụ 2025-2026)' })
  namHoc: string;

  @IsInt()
  @Min(1)
  thoiLuong: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maMon: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  danhSachMaCauHoi: number[];
}
