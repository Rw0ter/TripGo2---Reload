import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// 以 UTC+8（广东 / 北京时间）计算"当天"的日期键 YYYY-MM-DD。
// 与服务器本地时区无关：基于 epoch 毫秒加 8 小时偏移后取 UTC 日期部分，
// 保证签到日界按广东时间划分（旧实现直接用 UTC 日期，晚间签到会跨错天）。
// 导出为纯函数，便于单测覆盖跨时区边界。
export function beijingDateKey(now: Date = new Date()): string {
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return utc8.toISOString().slice(0, 10);
}

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async status(userId: string) {
    const today = beijingDateKey();
    const record = await this.prisma.checkin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const totalDays = await this.prisma.checkin.count({ where: { userId } });
    return { checkedIn: !!record, todayPoints: record?.points ?? 0, totalDays };
  }

  async checkin(userId: string) {
    const today = beijingDateKey();
    const existing = await this.prisma.checkin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) throw new BadRequestException('今日已签到');

    const points = Math.floor(Math.random() * 26) + 5; // random 5-30
    await this.prisma.checkin.create({
      data: { userId, date: today, points },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });
    const totalDays = await this.prisma.checkin.count({ where: { userId } });
    return { points, totalDays };
  }
}
