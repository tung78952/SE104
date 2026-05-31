import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maSV: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maLop: string;

  @IsInt()
  @Min(1)
  maDeThi: number;

  @IsInt()
  @Min(1)
  @Max(3)
  hocKy: number;

  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'Năm học phải có dạng YYYY-YYYY' })
  namHoc: string;

  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Điểm số tối đa 1 chữ số thập phân' })
  diemSo: number;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  ghiChu?: string;
}
