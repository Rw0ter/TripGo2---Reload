import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TripDayDto {
  @ApiProperty({ example: '广州早茶 + 永庆坊', description: '当天主题 / 标题' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  title: string;

  @ApiProperty({
    example: '上午陶陶居，下午逛永庆坊，傍晚珠江夜游',
    description: '当天备注（可选）',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}

export class CreateTripDto {
  @ApiProperty({ example: '岭南三日游', description: '行程名' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: '每天的安排，至少 1 天、至多 30 天',
    type: [TripDayDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => TripDayDto)
  days: TripDayDto[];
}
