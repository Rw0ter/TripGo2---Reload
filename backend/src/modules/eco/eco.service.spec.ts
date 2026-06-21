import { BadRequestException } from '@nestjs/common';
import { EcoService } from './eco.service';

function makePrisma() {
  const prisma: any = {
    user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    ecoActivity: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { carbonSaved: 0 } }),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    // 事务以数组形式调用：执行并 Promise.all 模拟原子提交
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return prisma;
}

describe('EcoService.status — 概览 + 植树进度', () => {
  it('返回碳积分/积分，并按每 20kg 一棵换算植树进度', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ carbonCredits: 120, points: 80 });
    prisma.ecoActivity.aggregate.mockResolvedValue({ _sum: { carbonSaved: 45 } });
    const svc = new EcoService(prisma);
    const r = await svc.status('u1');
    expect(r.carbonCredits).toBe(120);
    expect(r.points).toBe(80);
    expect(r.totalCarbonSaved).toBe(45);
    expect(r.treesPlanted).toBe(2); // floor(45 / 20)
    expect(r.treeProgress).toBe(5); // 45 % 20
    expect(r.treeTarget).toBe(20);
  });

  it('用户不存在 → 400', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    const svc = new EcoService(prisma);
    await expect(svc.status('x')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('EcoService.plant — 积分换碳积分种树', () => {
  it('积分不足 50 → 400，且不进事务', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ points: 30 });
    const svc = new EcoService(prisma);
    await expect(svc.plant('u1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('积分足够 → 扣 50 积分、增 100 碳积分、记一次植树', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ points: 60 });
    const svc = new EcoService(prisma);
    const r = await svc.plant('u1');
    expect(r.carbonAward).toBe(100);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { points: { decrement: 50 }, carbonCredits: { increment: 100 } },
      }),
    );
    expect(prisma.ecoActivity.create).toHaveBeenCalled();
  });
});

describe('EcoService.recordActivity — 绿色行为奖励', () => {
  it('未知活动类型 → 400', async () => {
    const prisma = makePrisma();
    const svc = new EcoService(prisma);
    await expect(svc.recordActivity('u1', 'bogus' as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('今日已完成同类活动 → 400（每日去重）', async () => {
    const prisma = makePrisma();
    prisma.ecoActivity.findFirst.mockResolvedValue({ id: 1 });
    const svc = new EcoService(prisma);
    await expect(svc.recordActivity('u1', 'green_travel')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('首次完成绿色出行 → +30 积分 +25 碳积分并记录活动', async () => {
    const prisma = makePrisma();
    prisma.ecoActivity.findFirst.mockResolvedValue(null);
    const svc = new EcoService(prisma);
    const r = await svc.recordActivity('u1', 'green_travel');
    expect(r.pointsAwarded).toBe(30);
    expect(r.carbonCreditsAwarded).toBe(25); // floor(2.5 * 10)
    expect(r.carbonSaved).toBe(2.5);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.ecoActivity.create).toHaveBeenCalled();
  });
});

describe('EcoService.progress — 7 日趋势', () => {
  it('返回 status 字段 + 长度 7 的 weeklyTrend', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ carbonCredits: 0, points: 0 });
    const svc = new EcoService(prisma);
    const r = await svc.progress('u1');
    expect(r).toHaveProperty('treeTarget', 20);
    expect(r.weeklyTrend).toHaveLength(7);
    expect(r.weeklyTrend[0]).toHaveProperty('date');
    expect(r.weeklyTrend[0]).toHaveProperty('carbonSaved');
  });
});
