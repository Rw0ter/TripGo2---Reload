import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

const REVIEW_SELECT = {
  id: true,
  rating: true,
  text: true,
  createdAt: true,
  author: { select: { username: true } },
} as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByItem(itemType: string, itemId: number) {
    return this.prisma.review.findMany({
      where: { itemType, itemId },
      orderBy: { createdAt: 'desc' },
      select: REVIEW_SELECT,
    });
  }

  async create(userId: string, dto: CreateReviewDto) {
    await this.assertTargetExists(dto.itemType, dto.itemId);
    return this.prisma.review.create({
      data: {
        authorId: userId,
        itemType: dto.itemType,
        itemId: dto.itemId,
        rating: dto.rating,
        text: dto.text,
      },
      select: REVIEW_SELECT,
    });
  }

  // 校验被评对象真实存在，避免对不存在的产品/景点刷评价。
  private async assertTargetExists(
    itemType: 'destination' | 'scenic',
    itemId: number,
  ) {
    const exists =
      itemType === 'destination'
        ? await this.prisma.destination.findUnique({
            where: { id: itemId },
            select: { id: true },
          })
        : await this.prisma.scenic.findUnique({
            where: { id: itemId },
            select: { id: true },
          });
    if (!exists) throw new NotFoundException('评价对象不存在');
  }
}
