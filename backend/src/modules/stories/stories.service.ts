import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // 取 userId 在给定动态里点过赞的 id 集合（未登录返回空集）。
  private async likedStoryIds(
    userId: string | undefined,
    storyIds: number[],
  ): Promise<Set<number>> {
    if (!userId || storyIds.length === 0) {
      return new Set();
    }
    const likes = await this.prisma.like.findMany({
      where: { userId, storyId: { in: storyIds } },
      select: { storyId: true },
    });
    return new Set(likes.map((l) => l.storyId));
  }

  // 社区动态流：按时间倒序，附作者、点赞 / 评论数与当前用户是否已点赞。
  async findAll(userId?: string) {
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
    const liked = await this.likedStoryIds(
      userId,
      rows.map((r) => r.id),
    );
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      images: s.images,
      createdAt: s.createdAt,
      author: s.author,
      likeCount: s._count.likes,
      commentCount: s._count.comments,
      liked: liked.has(s.id),
    }));
  }

  // 动态详情：含作者、点赞 / 评论数、评论列表与当前用户是否已点赞。
  async findOne(id: number, userId?: string) {
    const s = await this.prisma.story.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        createdAt: true,
        author: { select: { username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: { select: { username: true, avatar: true } },
          },
        },
      },
    });
    if (!s) {
      throw new NotFoundException('动态不存在');
    }
    const liked = await this.likedStoryIds(userId, [id]);
    return {
      id: s.id,
      title: s.title,
      content: s.content,
      images: s.images,
      createdAt: s.createdAt,
      author: s.author,
      likeCount: s._count.likes,
      commentCount: s._count.comments,
      liked: liked.has(id),
      comments: s.comments,
    };
  }

  // 发布动态。
  async create(userId: string, dto: CreateStoryDto) {
    const row = await this.prisma.story.create({
      data: {
        title: dto.title,
        content: dto.content,
        images: dto.images ?? [],
        authorId: userId,
      },
      select: { id: true },
    });
    return { id: row.id };
  }

  // 点赞 / 取消点赞（切换），返回切换后的状态与计数。
  // Like 表 @@id([storyId, userId]) 复合主键，天然保证一个用户一条点赞。
  async toggleLike(userId: string, storyId: number) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true },
    });
    if (!story) {
      throw new NotFoundException('动态不存在');
    }
    const existing = await this.prisma.like.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });
    if (existing) {
      await this.prisma.like.delete({
        where: { storyId_userId: { storyId, userId } },
      });
    } else {
      await this.prisma.like.create({ data: { storyId, userId } });
    }
    const likeCount = await this.prisma.like.count({ where: { storyId } });
    return { liked: !existing, likeCount };
  }

  // 发表评论，返回新评论（含作者）。
  async addComment(userId: string, storyId: number, dto: CreateCommentDto) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true },
    });
    if (!story) {
      throw new NotFoundException('动态不存在');
    }
    return this.prisma.comment.create({
      data: { text: dto.text, storyId, authorId: userId },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: { select: { username: true, avatar: true } },
      },
    });
  }
}
