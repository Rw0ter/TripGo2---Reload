import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'], description: '消息角色' })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ description: '消息内容', maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}

export class ChatDto {
  @ApiProperty({
    type: [ChatMessageDto],
    description: '对话历史（含本轮用户消息），按时间正序',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
