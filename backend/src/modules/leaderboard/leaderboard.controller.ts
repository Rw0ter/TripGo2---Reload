import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUserIdOptional } from '../../common/decorators/current-user.decorator';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly svc: LeaderboardService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '绿色先锋榜（综合分=(碳积分×10)+普通积分，top 100，20条/页）' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 20' })
  top(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUserIdOptional() userId?: string,
  ) {
    return this.svc.getRanking(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      userId,
    );
  }
}
