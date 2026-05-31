import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class GradeEntryDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maSV: string;

  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Điểm số tối đa 1 chữ số thập phân' })
  diemSo: number;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  ghiChu?: string;
}

export class CreateGradesBatchDto {
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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  danhSachDiem: GradeEntryDto[];
}
