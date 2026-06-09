import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

function mockPrisma() {
  return {
    favorite: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  } as any;
}

describe('FavoritesService.toggle', () => {
  const dto: ToggleFavoriteDto = { itemType: 'scenic', itemId: 1, title: 't' };

  it('未收藏 → 新建，返回 favorited:true', async () => {
    const prisma = mockPrisma();
    prisma.favorite.findUnique.mockResolvedValue(null);
    const svc = new FavoritesService(prisma);
    await expect(svc.toggle('u1', dto)).resolves.toEqual({ favorited: true });
    expect(prisma.favorite.create).toHaveBeenCalled();
  });

  it('已收藏 → 删除，返回 favorited:false', async () => {
    const prisma = mockPrisma();
    prisma.favorite.findUnique.mockResolvedValue({ id: 9 });
    const svc = new FavoritesService(prisma);
    await expect(svc.toggle('u1', dto)).resolves.toEqual({ favorited: false });
    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 9 } });
  });
});

describe('ToggleFavoriteDto 校验', () => {
  const v = (o: any) => validate(plainToInstance(ToggleFavoriteDto, o));
  it('合法通过', async () => {
    expect(await v({ itemType: 'scenic', itemId: 1, title: 't' })).toHaveLength(
      0,
    );
  });
  it('itemType 非法被拒', async () => {
    expect(
      (await v({ itemType: 'x', itemId: 1, title: 't' })).length,
    ).toBeGreaterThan(0);
  });
  it('title 空串被拒', async () => {
    expect(
      (await v({ itemType: 'scenic', itemId: 1, title: '' })).length,
    ).toBeGreaterThan(0);
  });
});
