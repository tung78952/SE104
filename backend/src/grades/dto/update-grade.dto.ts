import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Điểm số tối đa 1 chữ số thập phân' })
  diemSo?: number;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  ghiChu?: string;
}
