import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    const keyword = `%${q}%`;
    const [scenic, destinations] = await Promise.all([
      this.prisma.scenic.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { city: { contains: q } },
            { summary: { contains: q } },
            { tag: { contains: q } },
          ],
        },
        orderBy: { sort: 'asc' },
        take: 20,
      }),
      this.prisma.destination.findMany({
        where: {
          OR: [
            { title: { contains: q } },
          ],
        },
        take: 20,
      }),
    ]);
    return { scenic, destinations };
  }
}
