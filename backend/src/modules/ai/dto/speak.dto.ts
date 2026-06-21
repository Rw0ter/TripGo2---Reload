import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SpeakDto {
  @ApiProperty({ example: '低碳生活，从每一天开始', description: '要合成语音的文本' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
