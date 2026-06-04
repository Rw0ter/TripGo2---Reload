import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '广绣文创摆件', description: '订单标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 128, description: '实付金额' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 1, description: '关联的文创产品 id' })
  @IsInt()
  @Min(1)
  destinationId: number;
}
