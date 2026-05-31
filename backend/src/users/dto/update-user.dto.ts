import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from './create-user.dto';

export class UpdateUserDto {
  @IsEnum(Role)
  @IsOptional()
  vaiTro?: Role;

  @IsNumber()
  @IsOptional()
  trangThai?: number;

  @IsString()
  @IsOptional()
  hoTen?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
