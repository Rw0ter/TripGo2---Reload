import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthUser {
  userId: string;
  username: string;
}

// 从已通过 JwtAuthGuard 的请求里取出当前用户。
// 用法：@CurrentUser() user: AuthUser  或  @CurrentUser('userId') id: string
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | string => {
    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user) {
      // 用了 @CurrentUser() 却忘记加 @UseGuards(JwtAuthGuard) 时，给出明确错误
      throw new UnauthorizedException('缺少登录态');
    }
    return data ? user[data] : user;
  },
);

// 可选地取当前用户 id：配合 OptionalJwtAuthGuard，未登录时返回 undefined（不抛错）。
export const CurrentUserIdOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    return user?.userId;
  },
);
