import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// 可选鉴权守卫：带有效 Bearer JWT 时把 { userId, username } 挂到 request.user，
// 未带 / token 无效时也放行（request.user 为 undefined）。
// 用于「登录可看到更多字段、不登录也能访问」的接口，如带点赞态的动态列表。
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    if (type === 'Bearer' && token) {
      try {
        const payload = await this.jwtService.verifyAsync(token);
        request.user = { userId: payload.sub, username: payload.username };
      } catch {
        // token 无效视作未登录，不抛错
      }
    }
    return true;
  }
}
