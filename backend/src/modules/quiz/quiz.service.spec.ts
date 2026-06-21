import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuizService } from './quiz.service';

function mockPrisma() {
  return {
    quiz: { findUnique: jest.fn(), findMany: jest.fn() },
    user: { update: jest.fn().mockResolvedValue({}) },
  } as any;
}

describe('QuizService.findOne — 下发不含正确答案', () => {
  it('题目剥离 answer 字段', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '碳积分专场', title: '碳排放知识挑战' });
    const svc = new QuizService(prisma);
    const res = await svc.findOne(1);
    expect(res.questions.length).toBeGreaterThan(0);
    res.questions.forEach((q: any) => {
      expect(q).toHaveProperty('q');
      expect(q).toHaveProperty('options');
      expect(q).not.toHaveProperty('answer');
    });
  });

  it('不存在 → 404', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue(null);
    const svc = new QuizService(prisma);
    await expect(svc.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('QuizService.check — 逐题校验', () => {
  it('答对返回 correct:true + 正确答案', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '碳积分专场', title: '碳排放知识挑战' });
    const svc = new QuizService(prisma);
    // 碳积分专场第 0 题正确答案为 1
    expect(await svc.check(1, 0, 1)).toEqual({ correct: true, answer: 1 });
    expect(await svc.check(1, 0, 3)).toEqual({ correct: false, answer: 1 });
  });

  it('题号越界 → 400', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '碳积分专场', title: '碳排放知识挑战' });
    const svc = new QuizService(prisma);
    await expect(svc.check(1, 99, 0)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('QuizService.submit — 服务端判分发积分', () => {
  it('按答对数计分并 increment 积分', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '碳积分专场', title: '碳排放知识挑战' });
    const svc = new QuizService(prisma);
    // 碳积分专场答案 [1,1,2,2,1]，全对 → correct 5, score 50
    const res = await svc.submit(1, 'u1', [1, 1, 2, 2, 1]);
    expect(res).toEqual({ total: 5, correct: 5, score: 50 });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { points: { increment: 50 } },
    });
  });

  it('全错 → score 0，不发积分', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '碳积分专场', title: '碳排放知识挑战' });
    const svc = new QuizService(prisma);
    const res = await svc.submit(1, 'u1', [0, 0, 0, 0, 0]);
    expect(res.correct).toBe(0);
    expect(res.score).toBe(0);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
