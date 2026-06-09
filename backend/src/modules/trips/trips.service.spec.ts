import { NotFoundException } from '@nestjs/common';
import { TripsService } from './trips.service';

function mockPrisma() {
  return {
    trip: { findUnique: jest.fn(), delete: jest.fn() },
  } as any;
}

describe('TripsService.remove（删除行程的越权保护）', () => {
  it('本人 → 删除并返回 id', async () => {
    const prisma = mockPrisma();
    prisma.trip.findUnique.mockResolvedValue({ userId: 'u1' });
    prisma.trip.delete.mockResolvedValue({});
    const svc = new TripsService(prisma);
    await expect(svc.remove('t1', 'u1')).resolves.toEqual({ id: 't1' });
    expect(prisma.trip.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });

  it('他人行程 → 抛 404 且绝不删除', async () => {
    const prisma = mockPrisma();
    prisma.trip.findUnique.mockResolvedValue({ userId: 'owner' });
    const svc = new TripsService(prisma);
    await expect(svc.remove('t1', 'attacker')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.trip.delete).not.toHaveBeenCalled();
  });

  it('不存在 → 抛 404', async () => {
    const prisma = mockPrisma();
    prisma.trip.findUnique.mockResolvedValue(null);
    const svc = new TripsService(prisma);
    await expect(svc.remove('nope', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.trip.delete).not.toHaveBeenCalled();
  });
});
