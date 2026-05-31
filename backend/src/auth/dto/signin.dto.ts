import { IsNotEmpty, IsString } from 'class-validator';

export class SigninDto {
  @IsString()
  @IsNotEmpty()
  tenDangNhap: string;

  @IsString()
  @IsNotEmpty()
  matKhau: string;
}
