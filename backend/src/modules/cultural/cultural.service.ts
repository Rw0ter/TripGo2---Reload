import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CulturalService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCategory(category?: string) {
    return this.prisma.culturalContent.findMany({
      where: category ? { category } : {},
      orderBy: { sort: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.culturalContent.findUnique({ where: { id } });
  }
}
