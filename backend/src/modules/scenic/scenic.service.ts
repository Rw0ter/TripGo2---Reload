import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScenicService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { city?: string; hot?: boolean }) {
    return this.prisma.scenic.findMany({
      where: {
        ...(params.city ? { city: params.city } : {}),
        ...(params.hot === undefined ? {} : { hot: params.hot }),
      },
      orderBy: { sort: 'asc' },
    });
  }

  async findOne(id: number) {
    const scenic = await this.prisma.scenic.findUnique({ where: { id } });
    if (!scenic) {
      throw new NotFoundException('景点不存在');
    }
    return scenic;
  }
}
