import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, itemType: string, itemId: number, title: string, date?: string, location?: string, tag?: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.favorite.create({
      data: { userId, itemType, itemId, title, date: date ?? '', location: location ?? '', tag: tag ?? '' },
    });
    return { favorited: true };
  }
}
