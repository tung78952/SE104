import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maSV: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  hoTen: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maLop: string;
}
