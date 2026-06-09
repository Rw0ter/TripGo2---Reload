import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

function makeTx() {
  return {
    user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    order: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    transaction: { create: jest.fn().mockResolvedValue({}) },
  };
}

function makePrisma(tx = makeTx()) {
  const prisma: any = {
    destination: { findUnique: jest.fn() },
    scenic: { findUnique: jest.fn() },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  };
  prisma._tx = tx;
  return prisma;
}

describe('OrdersService.create — 服务端定价 + 扣款 + 流水（防 0 元下单）', () => {
  it('文创下单：用 destination.money 定价、扣余额、写出流水', async () => {
    const prisma = makePrisma();
    prisma.destination.findUnique.mockResolvedValue({
      id: 7,
      money: '128.00',
      title: '广绣团扇',
      image: 'a.png',
    });
    prisma._tx.user.findUnique.mockResolvedValue({ balance: 200 });
    const svc = new OrdersService(prisma);

    await svc.create('u1', { itemType: 'destination', itemId: 7 });

    expect(prisma._tx.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { balance: { decrement: 128 } },
    });
    expect(prisma._tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          price: 128,
          finalPrice: 128,
          title: '广绣团扇',
          type: '文创产品',
        }),
      }),
    );
    expect(prisma._tx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'out', amount: '-128.00' }),
      }),
    );
  });

  it('产品不存在 → 404，不进事务', async () => {
    const prisma = makePrisma();
    prisma.destination.findUnique.mockResolvedValue(null);
    const svc = new OrdersService(prisma);
    await expect(
      svc.create('u1', { itemType: 'destination', itemId: 999 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('余额不足 → 400，不扣款不建单', async () => {
    const prisma = makePrisma();
    prisma.destination.findUnique.mockResolvedValue({
      id: 7,
      money: '128.00',
      title: 'x',
      image: null,
    });
    prisma._tx.user.findUnique.mockResolvedValue({ balance: 50 });
    const svc = new OrdersService(prisma);
    await expect(
      svc.create('u1', { itemType: 'destination', itemId: 7 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma._tx.user.update).not.toHaveBeenCalled();
    expect(prisma._tx.order.create).not.toHaveBeenCalled();
  });

  it('景点下单：用 scenic.price 定价、type 为景点预订', async () => {
    const prisma = makePrisma();
    prisma.scenic.findUnique.mockResolvedValue({
      id: 1,
      price: 200,
      name: '广州塔',
      image: 'gz.jpg',
    });
    prisma._tx.user.findUnique.mockResolvedValue({ balance: 500 });
    const svc = new OrdersService(prisma);
    await svc.create('u1', { itemType: 'scenic', itemId: 1 });
    expect(prisma._tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          price: 200,
          title: '广州塔',
          type: '景点预订',
        }),
      }),
    );
  });

  it('景点 price<=0 → 400（暂不支持预订）', async () => {
    const prisma = makePrisma();
    prisma.scenic.findUnique.mockResolvedValue({
      id: 9,
      price: 0,
      name: 'POI',
      image: 'x',
    });
    const svc = new OrdersService(prisma);
    await expect(
      svc.create('u1', { itemType: 'scenic', itemId: 9 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
