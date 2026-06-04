import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '全局搜索景点/文创/动态（q 为空时返回全量供排行榜/猜你想搜使用）' })
  search(@Query('q') q: string) {
    const term = (q || '').trim();
    return this.searchService.search(term || '');
  }
}
