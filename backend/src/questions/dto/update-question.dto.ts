import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  noiDung?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  maMon?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maDoKho?: number;
}
