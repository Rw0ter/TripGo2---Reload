import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async top30(userId?: string) {
    const users = await this.prisma.user.findMany({
      select: { id: true, username: true, points: true },
      orderBy: { points: 'desc' },
      take: 30,
    });
    const self = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, points: true },
        })
      : null;
    return { list: users, self };
  }
}
