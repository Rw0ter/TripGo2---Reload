import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

// 仅测试 resetPassword 的身份核验 + 哈希落库；bcrypt 用真实实现（单次哈希很快）。
function make(userRow: unknown) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(userRow),
      update: jest.fn().mockResolvedValue({}),
    },
  } as any;
  const jwt = { signAsync: jest.fn() } as any;
  return { svc: new AuthService(prisma, jwt), prisma };
}

describe('AuthService.resetPassword — 身份核验后重置密码', () => {
  it('用户名 + 邮箱匹配 → 哈希后更新密码', async () => {
    const { svc, prisma } = make({ id: 'u1', username: 'alice', email: 'a@x.com', password: 'old' });
    const res = await svc.resetPassword({ username: 'alice', email: 'a@x.com', newPassword: 'newpass123' });
    expect(res).toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const arg = prisma.user.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'u1' });
    // 落库的是哈希、不是明文
    expect(arg.data.password).not.toBe('newpass123');
    expect(typeof arg.data.password).toBe('string');
  });

  it('邮箱与账号不匹配 → 400，且不更新', async () => {
    const { svc, prisma } = make({ id: 'u1', username: 'alice', email: 'a@x.com', password: 'old' });
    await expect(
      svc.resetPassword({ username: 'alice', email: 'wrong@x.com', newPassword: 'newpass123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('用户不存在 → 400（不暴露账号是否存在）', async () => {
    const { svc, prisma } = make(null);
    await expect(
      svc.resetPassword({ username: 'ghost', email: 'a@x.com', newPassword: 'newpass123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
