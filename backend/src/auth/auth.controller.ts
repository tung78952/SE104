import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import type { Response, Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Chỉ Admin được tạo tài khoản mới (cả Admin và Giảng viên)
  @Post('signup')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signinDto: SigninDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signin(signinDto);

    // Lưu refresh token vào cookie bảo mật (httpOnly)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return {
      accessToken: result.accessToken,
      userId: result.userId
    };
  }

  @Post('signout')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'giaovien')
  @HttpCode(HttpStatus.OK)
  async signout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Đăng xuất thành công' };
  }

  // Public: dùng refreshToken trong cookie để cấp accessToken mới
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'];
    return this.authService.refresh(refreshToken);
  }

  @Patch('change-password')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'giaovien')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = String(req.user.sub);
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
