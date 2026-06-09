import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '某产品/景点的评价列表' })
  findByItem(@Query() query: QueryReviewDto) {
    return this.svc.findByItem(query.itemType, query.itemId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评价' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateReviewDto) {
    return this.svc.create(userId, dto);
  }
}
