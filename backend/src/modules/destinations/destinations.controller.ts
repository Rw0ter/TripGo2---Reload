import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { QueryDestinationDto } from './dto/query-destination.dto';

@ApiTags('destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Get()
  @ApiOperation({ summary: '文创产品列表，可按 type 分类筛选' })
  findAll(@Query() query: QueryDestinationDto) {
    return this.destinationsService.findAll(query.type);
  }

  @Get(':id')
  @ApiOperation({ summary: '文创产品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOne(id);
  }
}
