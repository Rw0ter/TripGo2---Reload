import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PlanDto {
  @ApiProperty({ description: '出发地' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  from: string;

  @ApiProperty({ description: '目的地' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  to: string;

  @ApiProperty({ description: '人均预算（元）' })
  @IsInt()
  @Min(0)
  @Max(1000000)
  budget: number;

  @ApiProperty({ description: '行程天数' })
  @IsInt()
  @Min(1)
  @Max(30)
  days: number;

  @ApiPropertyOptional({ type: [String], description: '旅行偏好标签（中文）' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  tags?: string[];

  @ApiPropertyOptional({ description: '补充说明', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
