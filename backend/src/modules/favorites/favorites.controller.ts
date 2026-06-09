import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly svc: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '当前用户收藏列表' })
  findAll(@CurrentUser('userId') userId: string) {
    return this.svc.findMine(userId);
  }

  @Post()
  @ApiOperation({ summary: '收藏/取消收藏（切换）' })
  toggle(
    @CurrentUser('userId') userId: string,
    @Body() dto: ToggleFavoriteDto,
  ) {
    return this.svc.toggle(userId, dto);
  }
}
