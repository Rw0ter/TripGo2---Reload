import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Get()
  @ApiOperation({ summary: '消息列表（可按 tab 筛选）' })
  findAll(@Query('tab') tab?: string) {
    return this.svc.findAll(tab);
  }
}
