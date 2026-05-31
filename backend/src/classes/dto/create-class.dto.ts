import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maLop: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  tenLop: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maMon: string;
}
