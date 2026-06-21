import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    enum: ['destination', 'scenic'],
    description: '下单对象类型：生态良品 / 景点预订',
  })
  @IsIn(['destination', 'scenic'])
  itemType: 'destination' | 'scenic';

  @ApiProperty({ example: 1, description: '对象 id（destination 或 scenic 的 id）' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;

  @ApiPropertyOptional({ description: '以旧换新：回收旧物获得碳积分奖励', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  tradeIn?: boolean;
}
