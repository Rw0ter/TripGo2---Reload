import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // 社区动态流：按时间倒序，附作者信息与点赞 / 评论数。
  async findAll() {
    const rows = await this.prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        createdAt: true,
        author: { select: { username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      images: s.images,
      createdAt: s.createdAt,
      author: s.author,
      likeCount: s._count.likes,
      commentCount: s._count.comments,
    }));
  }
}
