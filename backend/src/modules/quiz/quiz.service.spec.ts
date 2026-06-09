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
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '粤剧', title: '粤剧问答' });
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
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '粤剧', title: '粤剧问答' });
    const svc = new QuizService(prisma);
    // 粤剧第 0 题正确答案为 1
    expect(await svc.check(1, 0, 1)).toEqual({ correct: true, answer: 1 });
    expect(await svc.check(1, 0, 3)).toEqual({ correct: false, answer: 1 });
  });

  it('题号越界 → 400', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '粤剧', title: '粤剧问答' });
    const svc = new QuizService(prisma);
    await expect(svc.check(1, 99, 0)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('QuizService.submit — 服务端判分发积分', () => {
  it('按答对数计分并 increment 积分', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '粤剧', title: '粤剧问答' });
    const svc = new QuizService(prisma);
    // 粤剧答案 [1,2,0]，全对 → correct 3, score 30
    const res = await svc.submit(1, 'u1', [1, 2, 0]);
    expect(res).toEqual({ total: 3, correct: 3, score: 30 });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { points: { increment: 30 } },
    });
  });

  it('全错 → score 0，不发积分', async () => {
    const prisma = mockPrisma();
    prisma.quiz.findUnique.mockResolvedValue({ id: 1, tag: '粤剧', title: '粤剧问答' });
    const svc = new QuizService(prisma);
    const res = await svc.submit(1, 'u1', [0, 0, 3]);
    expect(res.correct).toBe(0);
    expect(res.score).toBe(0);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
