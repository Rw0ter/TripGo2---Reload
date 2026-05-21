import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStoryDto {
  @ApiProperty({ example: '广绣初体验：一针一线绣木棉', description: '动态标题' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  title: string;

  @ApiProperty({ example: '今天去广绣工坊体验……', description: '动态正文' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    example: ['xc/xc_guangzhou.jpg'],
    description: '配图本地资源 key 列表，最多 3 张',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  images?: string[];
}
