import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '当前用户订单列表（可按 status 筛选）' })
  findAll(@CurrentUser('userId') userId: string, @Query('status') status?: string) {
    return this.orders.findMine(userId, status);
  }

  @Post()
  @ApiOperation({ summary: '创建订单（购买文创产品）' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateOrderDto) {
    return this.orders.create(userId, dto);
  }
}
