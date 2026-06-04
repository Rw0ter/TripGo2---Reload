import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async status(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const record = await this.prisma.checkin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const totalDays = await this.prisma.checkin.count({ where: { userId } });
    return { checkedIn: !!record, todayPoints: record?.points ?? 0, totalDays };
  }

  async checkin(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.prisma.checkin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) throw new BadRequestException('今日已签到');

    const points = 20; // base points per checkin
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
