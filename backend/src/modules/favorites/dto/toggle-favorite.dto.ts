import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ToggleFavoriteDto {
  @ApiProperty({
    enum: ['scenic', 'destination', 'activity'],
    description: '收藏对象类型',
  })
  @IsIn(['scenic', 'destination', 'activity'])
  itemType: 'scenic' | 'destination' | 'activity';

  @ApiProperty({ description: '对象 id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;

  @ApiProperty({ description: '标题', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ description: '日期', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  date?: string;

  @ApiPropertyOptional({ description: '地点', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ description: '标签', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag?: string;
}
