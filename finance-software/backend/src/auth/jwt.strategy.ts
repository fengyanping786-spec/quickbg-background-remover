import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// 所有权限列表
const ALL_PERMISSIONS = [
  'account:read', 'account:write', 'account:delete',
  'voucher:read', 'voucher:write', 'voucher:approve', 'voucher:delete',
  'invoice:read', 'invoice:write', 'invoice:delete',
  'report:read', 'report:export',
  'tax:read', 'tax:write',
  'user:read', 'user:write', 'user:delete',
  'tenant:read', 'tenant:write',
  'settings:read', 'settings:write',
];

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'finance-secret-key-2026',
    });
  }

  async validate(payload: any) {
    // 所有登录用户都有全部权限（开发环境简化）
    return {
      sub: payload.sub,
      username: payload.username,
      realName: payload.realName,
      isSuperAdmin: payload.isSuperAdmin,
      tenantId: payload.tenantId,
      permissions: ALL_PERMISSIONS,
    };
  }
}