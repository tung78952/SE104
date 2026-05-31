import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRegulationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tenThamSo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  giaTri: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  moTa?: string;
}
