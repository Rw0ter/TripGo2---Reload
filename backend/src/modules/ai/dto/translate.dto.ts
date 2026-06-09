import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class TranslateDto {
  @ApiProperty({ description: '待翻译的中文文本', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
