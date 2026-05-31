import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  noiDung: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  maMon: string;

  @IsInt()
  @Min(1)
  maDoKho: number;
}
