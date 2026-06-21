import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// 复用 checkin 模块的北京时间日期函数（相同逻辑：UTC+8 取当天日期键）
function beijingDateKey(now: Date = new Date()): string {
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return utc8.toISOString().slice(0, 10);
}

@Injectable()
export class EcoService {
  constructor(private readonly prisma: PrismaService) {}

  /** 获取用户环保状态概览 */
  async status(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { carbonCredits: true, points: true },
    });
    if (!user) throw new BadRequestException('用户不存在');

    const today = beijingDateKey();
    const todayActivities = await this.prisma.ecoActivity.findMany({
      where: { userId, date: today },
      orderBy: { createdAt: 'desc' },
    });

    // 累计减排总量（kg CO2）
    const totalCarbon = await this.prisma.ecoActivity.aggregate({
      where: { userId },
      _sum: { carbonSaved: true },
    });

    // 植树进度：每棵树 = 20 kg CO2 减排
    const treeTarget = 20;
    const totalSaved = totalCarbon._sum.carbonSaved ?? 0;
    const treeProgress = totalSaved % treeTarget;
    const treesPlanted = Math.floor(totalSaved / treeTarget);

    return {
      carbonCredits: user.carbonCredits,
      points: user.points,
      todayActivities,
      totalCarbonSaved: totalSaved,
      treesPlanted,
      treeProgress,
      treeTarget,
    };
  }

  /** 虚拟植树：消耗积分换取碳积分 */
  async plant(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');
    if (user.points < 50) throw new BadRequestException('积分不足，需要 50 积分种一棵树');

    const carbonAward = 100; // 种一棵树获 100 碳积分

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          points: { decrement: 50 },
          carbonCredits: { increment: carbonAward },
        },
      }),
      this.prisma.ecoActivity.create({
        data: {
          userId,
          type: 'plant_tree',
          points: -50,
          carbonSaved: 0,
          date: beijingDateKey(),
        },
      }),
    ]);

    return { carbonAward, message: '恭喜！你成功种下一棵虚拟树，获得 100 碳积分' };
  }

  /** 记录环保活动（绿色出行/垃圾分类/环保答题/分享等） */
  async recordActivity(
    userId: string,
    type: 'green_travel' | 'waste_sort' | 'eco_quiz' | 'share_green' | 'trade_in',
  ) {
    const rewards: Record<string, { points: number; carbonSaved: number }> = {
      green_travel: { points: 30, carbonSaved: 2.5 },
      waste_sort: { points: 25, carbonSaved: 1.2 },
      eco_quiz: { points: 40, carbonSaved: 0.8 },
      share_green: { points: 50, carbonSaved: 1.5 },
      trade_in: { points: 60, carbonSaved: 5.0 },
    };

    const reward = rewards[type];
    if (!reward) throw new BadRequestException('未知的环保活动类型');

    const today = beijingDateKey();
    const existing = await this.prisma.ecoActivity.findFirst({
      where: { userId, type, date: today },
    });
    if (existing) throw new BadRequestException('今日已完成该活动');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: reward.points },
          carbonCredits: { increment: Math.floor(reward.carbonSaved * 10) },
        },
      }),
      this.prisma.ecoActivity.create({
        data: {
          userId,
          type,
          points: reward.points,
          carbonSaved: reward.carbonSaved,
          date: today,
        },
      }),
    ]);

    return {
      pointsAwarded: reward.points,
      carbonCreditsAwarded: Math.floor(reward.carbonSaved * 10),
      carbonSaved: reward.carbonSaved,
      message: `环保活动完成！获得 ${reward.points} 积分 + ${Math.floor(reward.carbonSaved * 10)} 碳积分`,
    };
  }

  /** 获取树木成长可视化数据 */
  async progress(userId: string) {
    const stats = await this.status(userId);
    // 返回 7 日减排趋势
    const days: { date: string; carbonSaved: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000);
      const date = beijingDateKey(d);
      const agg = await this.prisma.ecoActivity.aggregate({
        where: { userId, date },
        _sum: { carbonSaved: true },
      });
      days.push({ date, carbonSaved: agg._sum.carbonSaved ?? 0 });
    }

    return {
      ...stats,
      weeklyTrend: days,
    };
  }
}
