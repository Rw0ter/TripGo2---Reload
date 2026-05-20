import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// 可复用鉴权守卫：校验 Bearer JWT，把 { userId, username } 挂到 request.user。
// 任何模块需要登录态：@UseGuards(JwtAuthGuard) + @CurrentUser()。
// 依赖的 JwtService 由全局 JwtModule 提供（见 AuthModule），故无需额外 import。
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('未提供 token');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = { userId: payload.sub, username: payload.username };
      return true;
    } catch {
      throw new UnauthorizedException('token 无效或已过期');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
