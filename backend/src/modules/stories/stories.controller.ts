import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoriesService } from './stories.service';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @ApiOperation({ summary: '社区动态流（按时间倒序，含作者与点赞/评论数）' })
  findAll() {
    return this.storiesService.findAll();
  }
}
