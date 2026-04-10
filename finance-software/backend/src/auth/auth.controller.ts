import { Controller, Post, Get, Body, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login - 用户登录
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/register - 用户注册
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * GET /auth/profile - 获取当前用户信息
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.sub,
      username: user.username,
      realName: user.realName,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId,
    };
  }

  /**
   * POST /auth/change-password - 修改密码
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(user.sub, body.oldPassword, body.newPassword);
    return { message: '密码修改成功' };
  }

  /**
   * POST /auth/reset-password - 重置密码（管理员）
   */
  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(
    @Body() body: { userId: string; newPassword: string },
  ) {
    await this.authService.resetPassword(body.userId, body.newPassword);
    return { message: '密码重置成功' };
  }

  /**
   * GET /auth/verify - 验证 Token
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@CurrentUser() user: any) {
    return { valid: true, user: user.username };
  }
}