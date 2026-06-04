import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByItem(itemType: string, itemId: number) {
    return this.prisma.review.findMany({
      where: { itemType, itemId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, text: true, createdAt: true, author: { select: { username: true } } },
    });
  }

  async create(userId: string, itemType: string, itemId: number, rating: number, text: string) {
    return this.prisma.review.create({
      data: { authorId: userId, itemType, itemId, rating, text },
      select: { id: true, rating: true, text: true, createdAt: true, author: { select: { username: true } } },
    });
  }
}
