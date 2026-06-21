import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** 绿色先锋榜 — 按综合分排序：(carbonCredits * 10) + points，top 100，20 条/页 */
  async getRanking(page = 1, pageSize = 20, userId?: string) {
    const take = Math.min(pageSize, 100);
    const skip = (Math.max(page, 1) - 1) * take;

    // 取全量用户，按综合分排序，取 top 100
    const all = await this.prisma.user.findMany({
      select: { id: true, username: true, points: true, carbonCredits: true },
      orderBy: [{ points: 'desc' }, { carbonCredits: 'desc' }],
      take: 100,
    });

    // 计算综合分排序
    const sorted = all
      .map((u) => ({
        ...u,
        score: u.carbonCredits * 10 + u.points,
      }))
      .sort((a, b) => b.score - a.score);

    const total = sorted.length;
    const list = sorted.slice(skip, skip + take).map((u, i) => ({
      rank: skip + i + 1,
      id: u.id,
      username: u.username,
      points: u.points,
      carbonCredits: u.carbonCredits,
      score: u.score,
    }));

    // 登录用户查找自己的排名
    let self: { rank: number; username: string; points: number; carbonCredits: number; score: number } | null = null;
    if (userId) {
      const me = sorted.find((u) => u.id === userId);
      if (me) {
        self = {
          rank: sorted.indexOf(me) + 1,
          username: me.username,
          points: me.points,
          carbonCredits: me.carbonCredits,
          score: me.score,
        };
      }
    }

    return { list, total, page, pageSize: take, self };
  }
}
