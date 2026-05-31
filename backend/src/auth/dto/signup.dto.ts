import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum Role {
  ADMIN = 'admin',
  GIAOVIEN = 'giaovien',
}

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  tenDangNhap: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  matKhau: string;

  @IsString()
  @IsNotEmpty()
  hoTen: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  khoaBoMon?: string;

  @IsEnum(Role)
  @IsNotEmpty()
  vaiTro: Role;
}
