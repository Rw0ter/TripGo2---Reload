import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripsService } from './trips.service';

@ApiTags('trips')
@Controller('trips')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Post()
  @ApiOperation({ summary: '创建行程' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateTripDto) {
    return this.trips.create(userId, dto);
  }

  // 路由顺序：'mine' 在 ':id' 之前，避免被吞成 id 参数。
  @Get('mine')
  @ApiOperation({ summary: '当前用户的行程列表（按最近更新倒序）' })
  mine(@CurrentUser('userId') userId: string) {
    return this.trips.findMine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '行程详情（仅本人可读）' })
  findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.trips.findOne(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除行程（仅本人，越权或不存在统一 404）' })
  remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.trips.remove(id, userId);
  }
}
