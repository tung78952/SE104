import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateRegulationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  giaTri: string;
}
