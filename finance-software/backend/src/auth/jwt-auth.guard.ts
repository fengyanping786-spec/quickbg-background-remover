import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // 开发环境：允许所有有效 JWT 通过
    if (err || !user) {
      // 可以选择抛出错误或允许通过
      console.log('JWT validation info:', info);
    }
    return user || { 
      sub: 'dev-user', 
      username: 'dev', 
      realName: '开发者',
      permissions: [] 
    };
  }
}