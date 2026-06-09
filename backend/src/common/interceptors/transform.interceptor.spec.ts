import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

function ctxWith(res: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getResponse: () => res }),
  } as never;
}

function handlerOf(value: unknown) {
  return { handle: () => of(value) } as never;
}

describe('TransformInterceptor', () => {
  it('普通响应包成 { code: 0, message: ok, data }', (done) => {
    const res = { headersSent: false, getHeader: () => undefined };
    new TransformInterceptor()
      .intercept(ctxWith(res), handlerOf({ a: 1 }))
      .subscribe((out) => {
        expect(out).toEqual({ code: 0, message: 'ok', data: { a: 1 } });
        done();
      });
  });

  it('SSE（Content-Type=text/event-stream）原样放行，不包信封', (done) => {
    const res = {
      headersSent: true,
      getHeader: () => 'text/event-stream; charset=utf-8',
    };
    new TransformInterceptor()
      .intercept(ctxWith(res), handlerOf(undefined))
      .subscribe((out) => {
        expect(out).toBeUndefined();
        done();
      });
  });

  it('headersSent 已发头时放行（防 headers already sent）', (done) => {
    const res = { headersSent: true, getHeader: () => undefined };
    new TransformInterceptor()
      .intercept(ctxWith(res), handlerOf('raw'))
      .subscribe((out) => {
        expect(out).toBe('raw');
        done();
      });
  });
});
