import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(type?: number) {
    return this.prisma.destination.findMany({
      where: type === undefined ? undefined : { type },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });
    if (!destination) {
      throw new NotFoundException('文创产品不存在');
    }
    return destination;
  }
}
