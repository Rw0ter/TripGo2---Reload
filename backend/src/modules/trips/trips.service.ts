import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建当前用户的行程。
  // days: 可选字段 notes 让 TS 视为含 undefined → 与 Prisma 的 InputJsonValue
  // 不兼容；cast 一下，由 DTO 校验保证形状正确。
  async create(userId: string, dto: CreateTripDto) {
    const row = await this.prisma.trip.create({
      data: {
        name: dto.name,
        days: dto.days as unknown as Prisma.InputJsonValue,
        userId,
      },
      select: { id: true },
    });
    return { id: row.id };
  }

  // 当前用户的行程列表，按最近更新倒序。
  async findMine(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        days: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // 行程详情；仅本人可读，否则统一抛 404（不区分「不存在 / 越权」）。
  async findOne(id: string, userId: string) {
    const row = await this.prisma.trip.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        days: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('行程不存在');
    }
    const { userId: _ownerId, ...rest } = row;
    return rest;
  }
}
