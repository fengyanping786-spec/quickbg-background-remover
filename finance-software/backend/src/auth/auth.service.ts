import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  realName: string;
  email: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 验证用户
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { username, status: 'active' as any }
    });

    if (!user) {
      return null;
    }

    // 验证密码（支持两种格式：bcrypt 和旧版 hashed）
    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * 登录
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT
    const payload = {
      sub: user.id,
      username: user.username,
      realName: user.realName,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * 注册
   */
  async register(registerDto: RegisterDto) {
    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username }
    });

    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    // 检查邮箱是否存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingEmail) {
      throw new UnauthorizedException('邮箱已被使用');
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      username: registerDto.username,
      password: passwordHash,
      realName: registerDto.realName,
      email: registerDto.email,
      phone: registerDto.phone,
      status: 'active' as any,
      isSuperAdmin: false,
    });

    const savedUser = await this.userRepository.save(user);

    // 返回时移除密码
    const { password, ...result } = savedUser as any;
    return result;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isValid = await this.comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('原密码错误');
    }

    // 更新密码
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  /**
   * 重置密码（管理员）
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  // 密码比较（兼容旧版）
  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // bcrypt 加密
    if (hashedPassword.startsWith('$2')) {
      return bcrypt.compare(plainPassword, hashedPassword);
    }

    // 旧版简单加密
    if (hashedPassword.startsWith('hashed:')) {
      return plainPassword === hashedPassword.replace('hashed:', '');
    }

    return false;
  }
}