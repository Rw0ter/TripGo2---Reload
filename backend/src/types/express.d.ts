import { AuthUser } from '../common/decorators/current-user.decorator';

// 让 JwtAuthGuard 写入、控制器读取的 request.user 在全项目获得类型。
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
