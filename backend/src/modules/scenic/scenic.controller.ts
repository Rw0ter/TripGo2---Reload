import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScenicService } from './scenic.service';
import { QueryScenicDto } from './dto/query-scenic.dto';

@ApiTags('scenic')
@Controller('scenic')
export class ScenicController {
  constructor(private readonly scenicService: ScenicService) {}

  @Get()
  @ApiOperation({ summary: '景点列表，可按 city / hot 筛选' })
  findAll(@Query() query: QueryScenicDto) {
    return this.scenicService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '景点详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scenicService.findOne(id);
  }
}
