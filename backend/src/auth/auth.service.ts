import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async signup(signupDto: SignupDto) {
    const existingUser = await this.prisma.taiKhoan.findFirst({
      where: { tenDangNhap: signupDto.tenDangNhap }
    });
    if (existingUser) throw new ConflictException('Tên đăng nhập đã tồn tại');

    if (signupDto.vaiTro === 'giaovien') {
       const existingGV = await this.prisma.giangVien.findFirst({
         where: { email: signupDto.email }
       });
       if (existingGV) throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(signupDto.matKhau, 10);

    if (signupDto.vaiTro === 'admin') {
      const newUser = await this.prisma.taiKhoan.create({
        data: {
          tenDangNhap: signupDto.tenDangNhap,
          matKhau: hashedPassword,
          vaiTro: 'admin',
          trangThai: 1
        }
      });
      return { message: 'Đăng ký Admin thành công', userId: newUser.maTK };
    } else {
      const gvCount = await this.prisma.giangVien.count();
      const maGV = `GV${(gvCount + 1).toString().padStart(2, '0')}`;
      
      const newGV = await this.prisma.giangVien.create({
        data: {
          maGV,
          hoTen: signupDto.hoTen,
          email: signupDto.email,
          khoaBoMon: signupDto.khoaBoMon,
          taiKhoan: {
            create: {
              tenDangNhap: signupDto.tenDangNhap,
              matKhau: hashedPassword,
              vaiTro: 'giaovien',
              trangThai: 1
            }
          }
        },
        include: { taiKhoan: true }
      });
      return { message: 'Đăng ký Giáo viên thành công', userId: newGV.taiKhoan?.maTK };
    }
  }

  async signin(signinDto: SigninDto) {
    const user = await this.prisma.taiKhoan.findUnique({
      where: { tenDangNhap: signinDto.tenDangNhap }
    });
    
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
    if (user.trangThai === 0) throw new UnauthorizedException('Tài khoản đã bị khóa');

    const isMatch = await bcrypt.compare(signinDto.matKhau, user.matKhau);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng');

    const payload = { sub: user.maTK, vaiTro: user.vaiTro, maGV: user.maGV };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken, userId: user.maTK };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const newPayload = { sub: payload.sub, vaiTro: payload.vaiTro, maGV: payload.maGV };
      const newAccessToken = await this.jwtService.signAsync(newPayload, { expiresIn: '15m' });
      return { accessToken: newAccessToken };
    } catch (e) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.taiKhoan.findUnique({ where: { maTK: Number(userId) } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const isMatch = await bcrypt.compare(changePasswordDto.matKhauCu, user.matKhau);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu cũ không chính xác');

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.matKhauMoi, 10);
    await this.prisma.taiKhoan.update({
      where: { maTK: Number(userId) },
      data: { matKhau: hashedNewPassword }
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}
