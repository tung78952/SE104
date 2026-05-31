import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  tenMon?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  soTinChi?: number;
}
