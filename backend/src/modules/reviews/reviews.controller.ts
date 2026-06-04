import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '某产品/景点的评价列表' })
  findByItem(@Query('itemType') itemType: string, @Query('itemId') itemId: string) {
    return this.svc.findByItem(itemType, parseInt(itemId) || 0);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评价' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() body: { itemType: string; itemId: number; rating: number; text: string },
  ) {
    return this.svc.create(userId, body.itemType, body.itemId, body.rating, body.text);
  }
}
