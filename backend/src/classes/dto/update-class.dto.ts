import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  tenLop?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  maMon?: string;
}
