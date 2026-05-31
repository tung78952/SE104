import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// Tái sử dụng enum Role hoặc khai báo lại
export enum Role {
  ADMIN = 'admin',
  GIAOVIEN = 'giaovien',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  tenDangNhap: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  matKhau: string;

  @IsEnum(Role)
  @IsNotEmpty()
  vaiTro: Role;

  @IsString()
  @IsNotEmpty()
  hoTen: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  khoaBoMon?: string;
}
