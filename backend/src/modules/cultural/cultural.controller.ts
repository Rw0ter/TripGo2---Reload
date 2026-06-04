import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CulturalService } from './cultural.service';

@ApiTags('cultural')
@Controller('cultural')
export class CulturalController {
  constructor(private readonly svc: CulturalService) {}

  @Get()
  @ApiOperation({ summary: '文化内容列表（可按 category 筛选：phrase/lesson/topic/vr_scene）' })
  findAll(@Query('category') category?: string) {
    return this.svc.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '文化内容详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
}
