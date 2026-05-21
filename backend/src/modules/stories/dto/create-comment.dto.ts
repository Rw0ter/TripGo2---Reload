import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '这门手艺真该好好传下去', description: '评论内容' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
