import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ enum: ['destination', 'scenic'], description: '评价对象类型' })
  @IsIn(['destination', 'scenic'])
  itemType: 'destination' | 'scenic';

  @ApiProperty({ description: '评价对象 id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;

  @ApiProperty({ description: '评分（1-5）' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '评价内容', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
