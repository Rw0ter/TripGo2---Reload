import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string, status?: string) {
    return this.prisma.order.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateOrderDto) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: dto.destinationId },
    });

    return this.prisma.order.create({
      data: {
        userId,
        type: '文创产品',
        title: dto.title,
        price: dto.price,
        oriPrice: dto.price,
        finalPrice: dto.price,
        img: destination?.image ?? null,
      },
    });
  }
}
