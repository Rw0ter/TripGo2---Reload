import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class QueryReviewDto {
  @ApiProperty({ enum: ['destination', 'scenic'], description: '评价对象类型' })
  @IsIn(['destination', 'scenic'])
  itemType: 'destination' | 'scenic';

  @ApiProperty({ description: '评价对象 id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;
}
