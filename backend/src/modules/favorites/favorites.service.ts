import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, dto: ToggleFavoriteDto) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_itemType_itemId: {
          userId,
          itemType: dto.itemType,
          itemId: dto.itemId,
        },
      },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.favorite.create({
      data: {
        userId,
        itemType: dto.itemType,
        itemId: dto.itemId,
        title: dto.title,
        date: dto.date ?? '',
        location: dto.location ?? '',
        tag: dto.tag ?? '',
      },
    });
    return { favorited: true };
  }
}
