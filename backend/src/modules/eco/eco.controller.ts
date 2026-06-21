import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EcoService } from './eco.service';
import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordActivityDto {
  @ApiProperty({ description: '活动类型', enum: ['green_travel', 'waste_sort', 'eco_quiz', 'share_green', 'trade_in'] })
  @IsNotEmpty()
  @IsIn(['green_travel', 'waste_sort', 'eco_quiz', 'share_green', 'trade_in'])
  type!: string;
}

@ApiTags('eco')
@Controller('eco')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EcoController {
  constructor(private readonly svc: EcoService) {}

  @Get('status')
  @ApiOperation({ summary: '获取用户环保状态（碳积分/植树进度/今日活动）' })
  status(@CurrentUser('userId') userId: string) {
    return this.svc.status(userId);
  }

  @Post('plant')
  @ApiOperation({ summary: '虚拟植树（消耗 50 积分获取 100 碳积分）' })
  plant(@CurrentUser('userId') userId: string) {
    return this.svc.plant(userId);
  }

  @Post('activity')
  @ApiOperation({ summary: '记录环保活动（绿色出行/垃圾分类/环保答题/分享绿色生活）' })
  recordActivity(
    @CurrentUser('userId') userId: string,
    @Body() dto: RecordActivityDto,
  ) {
    return this.svc.recordActivity(userId, dto.type as any);
  }

  @Get('progress')
  @ApiOperation({ summary: '获取环保进度（含 7 日减排趋势 + 植树进度）' })
  progress(@CurrentUser('userId') userId: string) {
    return this.svc.progress(userId);
  }
}
