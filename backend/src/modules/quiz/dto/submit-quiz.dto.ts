import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class SubmitQuizDto {
  @ApiProperty({ type: [Number], description: '每题所选选项下标，按题序排列' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Type(() => Number)
  answers: number[];
}
