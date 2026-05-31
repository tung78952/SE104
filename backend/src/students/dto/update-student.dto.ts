import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  hoTen?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  maLop?: string;
}
