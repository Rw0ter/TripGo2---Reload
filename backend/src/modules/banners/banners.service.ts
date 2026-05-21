import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { sort: 'asc' } });
  }
}
