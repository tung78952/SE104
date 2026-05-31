import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateDifficultyDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  tenDoKho?: string;
}
