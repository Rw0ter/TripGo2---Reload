import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class QueryScenicDto {
  @ApiPropertyOptional({ description: '按城市筛选' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: '只看人气榜（传 true）' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hot?: boolean;
}
