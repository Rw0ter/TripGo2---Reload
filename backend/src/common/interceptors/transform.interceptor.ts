import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 把所有正常响应包成统一格式：{ code: 0, message: 'ok', data }
// 例外：SSE / 流式接口（如 ai 模块 DeepSeek 代理）用 @Res() 自行写出，
// 不应再包统一信封 —— 检测到响应已发头或为 text/event-stream 时原样放行。
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const res = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => {
        const contentType = String(res.getHeader('Content-Type') ?? '');
        if (res.headersSent || contentType.includes('text/event-stream')) {
          return data as T;
        }
        return { code: 0, message: 'ok', data };
      }),
    );
  }
}
