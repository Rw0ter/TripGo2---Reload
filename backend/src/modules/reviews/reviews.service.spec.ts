import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

function mockPrisma() {
  return {
    destination: { findUnique: jest.fn() },
    scenic: { findUnique: jest.fn() },
    review: { create: jest.fn(), findMany: jest.fn() },
  } as any;
}

describe('ReviewsService.create（被评对象存在性校验）', () => {
  const dto: CreateReviewDto = {
    itemType: 'destination',
    itemId: 7,
    rating: 5,
    text: '很好',
  };

  it('对象存在 → 写入评价', async () => {
    const prisma = mockPrisma();
    prisma.destination.findUnique.mockResolvedValue({ id: 7 });
    prisma.review.create.mockResolvedValue({ id: 1 });
    const svc = new ReviewsService(prisma);
    await svc.create('u1', dto);
    expect(prisma.review.create).toHaveBeenCalled();
  });

  it('对象不存在 → 抛 404 且不写库', async () => {
    const prisma = mockPrisma();
    prisma.destination.findUnique.mockResolvedValue(null);
    const svc = new ReviewsService(prisma);
    await expect(svc.create('u1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('scenic 类型走 scenic 表校验', async () => {
    const prisma = mockPrisma();
    prisma.scenic.findUnique.mockResolvedValue({ id: 2 });
    prisma.review.create.mockResolvedValue({ id: 1 });
    const svc = new ReviewsService(prisma);
    await svc.create('u1', { itemType: 'scenic', itemId: 2, rating: 4, text: 'ok' });
    expect(prisma.scenic.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      select: { id: true },
    });
  });
});

describe('CreateReviewDto 校验', () => {
  const v = (o: any) => validate(plainToInstance(CreateReviewDto, o));
  it('合法通过', async () => {
    expect(
      await v({ itemType: 'destination', itemId: 7, rating: 5, text: '很好' }),
    ).toHaveLength(0);
  });
  it('rating 超界(99)被拒', async () => {
    expect(
      (await v({ itemType: 'destination', itemId: 7, rating: 99, text: 'x' }))
        .length,
    ).toBeGreaterThan(0);
  });
  it('itemType 非法被拒', async () => {
    expect(
      (await v({ itemType: 'hacker', itemId: 7, rating: 5, text: 'x' })).length,
    ).toBeGreaterThan(0);
  });
  it('text 空串被拒', async () => {
    expect(
      (await v({ itemType: 'scenic', itemId: 1, rating: 5, text: '' })).length,
    ).toBeGreaterThan(0);
  });
});
