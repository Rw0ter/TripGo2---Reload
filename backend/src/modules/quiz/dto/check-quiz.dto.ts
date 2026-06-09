import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CheckQuizDto {
  @ApiProperty({ description: '题目序号（从 0 开始）' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  questionIndex: number;

  @ApiProperty({ description: '所选选项下标（从 0 开始）' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  choice: number;
}
