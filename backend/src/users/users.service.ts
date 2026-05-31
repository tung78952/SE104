import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.taiKhoan.findUnique({
      where: { maTK: Number(userId) },
      include: { giangVien: true }
    });
    if (!user) throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    
    const { matKhau, ...userInfo } = user;
    return userInfo;
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const user = await this.prisma.taiKhoan.findUnique({ where: { maTK: Number(userId) } });
    if (!user) throw new NotFoundException('Không tìm thấy thông tin tài khoản');

    if (user.vaiTro === 'giaovien' && user.maGV) {
      await this.prisma.giangVien.update({
        where: { maGV: user.maGV },
        data: {
          hoTen: updateData.hoTen,
          email: updateData.email,
          khoaBoMon: updateData.khoaBoMon
        }
      });
    }
    return this.getProfile(userId);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.taiKhoan.findMany({
        skip,
        take: limit,
        select: {
          maTK: true,
          tenDangNhap: true,
          vaiTro: true,
          trangThai: true,
          giangVien: true
        }
      }),
      this.prisma.taiKhoan.count()
    ]);
    
    return { users, total, page, limit };
  }

  async findOne(maTK: string) {
    const user = await this.prisma.taiKhoan.findUnique({
      where: { maTK: Number(maTK) },
      select: {
        maTK: true,
        tenDangNhap: true,
        vaiTro: true,
        trangThai: true,
        giangVien: true
      }
    });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    return { user };
  }

  async create(createDto: CreateUserDto) {
    const exists = await this.prisma.taiKhoan.findFirst({ where: { tenDangNhap: createDto.tenDangNhap } });
    if (exists) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const hashedPassword = await bcrypt.hash(createDto.matKhau, 10);

    if (createDto.vaiTro === 'giaovien') {
      const emailExists = await this.prisma.giangVien.findFirst({ where: { email: createDto.email } });
      if (emailExists) throw new ConflictException('Email đã được sử dụng');

      const count = await this.prisma.giangVien.count();
      const maGV = `GV${(count + 1).toString().padStart(2, '0')}`;
      
      const newGV = await this.prisma.giangVien.create({
        data: {
          maGV, 
          hoTen: createDto.hoTen, 
          email: createDto.email, 
          khoaBoMon: createDto.khoaBoMon,
          taiKhoan: {
            create: { tenDangNhap: createDto.tenDangNhap, matKhau: hashedPassword, vaiTro: 'giaovien', trangThai: 1 }
          }
        },
        include: { taiKhoan: true }
      });
      return { message: 'Tạo tài khoản thành công', userId: newGV.taiKhoan?.maTK };
    } else {
      const newUser = await this.prisma.taiKhoan.create({
        data: { tenDangNhap: createDto.tenDangNhap, matKhau: hashedPassword, vaiTro: 'admin', trangThai: 1 }
      });
      return { message: 'Tạo tài khoản thành công', userId: newUser.maTK };
    }
  }

  async update(maTK: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.taiKhoan.findUnique({ where: { maTK: Number(maTK) }, include: { giangVien: true }});
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');

    // Cập nhật GiangVien nếu có
    if (user.giangVien) {
       await this.prisma.giangVien.update({
         where: { maGV: user.giangVien.maGV },
         data: {
           hoTen: updateDto.hoTen !== undefined ? updateDto.hoTen : undefined,
           email: updateDto.email !== undefined ? updateDto.email : undefined
         }
       });
    }

    // Cập nhật TaiKhoan
    if (updateDto.vaiTro || updateDto.trangThai !== undefined) {
      await this.prisma.taiKhoan.update({
        where: { maTK: Number(maTK) },
        data: {
          vaiTro: updateDto.vaiTro,
          trangThai: updateDto.trangThai
        }
      });
    }

    return this.findOne(maTK);
  }

  async remove(maTK: string, currentAdminId: string) {
    if (maTK === currentAdminId) throw new ForbiddenException('Bạn không thể tự xóa tài khoản của chính mình');

    const user = await this.prisma.taiKhoan.findUnique({ where: { maTK: Number(maTK) }});
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');

    if (user.maGV) {
      await this.prisma.giangVien.delete({ where: { maGV: user.maGV }}); // Xóa Giảng viên (sẽ auto-cascade xóa TaiKhoan hoặc ta xóa Tài Khoản thủ công)
    } else {
      await this.prisma.taiKhoan.delete({ where: { maTK: Number(maTK) } });
    }

    return { message: 'Xóa tài khoản thành công' };
  }
}
