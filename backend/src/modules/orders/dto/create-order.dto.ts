import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    enum: ['destination', 'scenic'],
    description: '下单对象类型：文创产品 / 景点预订',
  })
  @IsIn(['destination', 'scenic'])
  itemType: 'destination' | 'scenic';

  @ApiProperty({ example: 1, description: '对象 id（destination 或 scenic 的 id）' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;
}
