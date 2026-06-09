import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CheckinService } from './checkin.service';

@ApiTags('checkin')
@Controller('checkin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckinController {
  constructor(private readonly svc: CheckinService) {}

  @Get('status')
  @ApiOperation({ summary: '今日签到状态' })
  status(@CurrentUser('userId') userId: string) {
    return this.svc.status(userId);
  }

  @Post()
  @ApiOperation({ summary: '每日签到（随机 +5~30 积分，按 UTC+8 判定当天）' })
  checkin(@CurrentUser('userId') userId: string) {
    return this.svc.checkin(userId);
  }
}
