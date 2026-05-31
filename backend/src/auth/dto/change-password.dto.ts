import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  matKhauCu: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  matKhauMoi: string;
}
