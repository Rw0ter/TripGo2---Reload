import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserIdOptional,
} from '../../common/decorators/current-user.decorator';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '社区动态流（按时间倒序，含作者/点赞/评论数，登录则带 liked）',
  })
  findAll(@CurrentUserIdOptional() userId?: string) {
    return this.storiesService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '动态详情（含评论列表，登录则带 liked）' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserIdOptional() userId?: string,
  ) {
    return this.storiesService.findOne(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布动态' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateStoryDto) {
    return this.storiesService.create(userId, dto);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞 / 取消点赞（切换）' })
  toggleLike(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.storiesService.toggleLike(userId, id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评论' })
  addComment(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.storiesService.addComment(userId, id, dto);
  }
}
