import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

interface ResolvedItem {
  price: number;
  title: string;
  image: string | null;
  orderType: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string, status?: string) {
    return this.prisma.order.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 服务端定价下单：价格/标题/图片全部由后端按 itemType 取真实数据（不信任客户端），
  // 在事务内校验余额 → 扣余额 → 建订单 → 写流水，保证一致性。
  async create(userId: string, dto: CreateOrderDto) {
    const item = await this.resolveItem(dto.itemType, dto.itemId);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      if (!user) throw new NotFoundException('用户不存在');
      if (user.balance < item.price) {
        throw new BadRequestException('余额不足');
      }
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: item.price } },
      });
      const order = await tx.order.create({
        data: {
          userId,
          type: item.orderType,
          title: item.title,
          img: item.image,
          price: item.price,
          oriPrice: item.price,
          finalPrice: item.price,
          status: '已支付',
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'out',
          title: item.title,
          amount: `-${item.price.toFixed(2)}`,
        },
      });
      return order;
    });
  }

  // 按 itemType 解析下单对象，返回服务端权威的价格/标题/图片。
  private async resolveItem(
    itemType: 'destination' | 'scenic',
    itemId: number,
  ): Promise<ResolvedItem> {
    if (itemType === 'destination') {
      const dest = await this.prisma.destination.findUnique({
        where: { id: itemId },
      });
      if (!dest) throw new NotFoundException('产品不存在');
      const price = Number(dest.money);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('产品价格异常');
      }
      return {
        price,
        title: dest.title,
        image: dest.image,
        orderType: '文创产品',
      };
    }
    const scenic = await this.prisma.scenic.findUnique({
      where: { id: itemId },
    });
    if (!scenic) throw new NotFoundException('景点不存在');
    if (scenic.price <= 0) {
      throw new BadRequestException('该景点暂不支持预订');
    }
    return {
      price: scenic.price,
      title: scenic.name,
      image: scenic.image,
      orderType: '景点预订',
    };
  }
}
