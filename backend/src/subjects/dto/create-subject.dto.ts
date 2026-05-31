import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maMon: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  tenMon: string;

  @IsInt()
  @Min(1)
  soTinChi: number;
}
