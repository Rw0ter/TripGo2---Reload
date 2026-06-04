import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '全局搜索景点/文创/动态' })
  search(@Query('q') q: string) {
    if (!q || !q.trim()) return { scenic: [], destinations: [] };
    return this.searchService.search(q.trim());
  }
}
