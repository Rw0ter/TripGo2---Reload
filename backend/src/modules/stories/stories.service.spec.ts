import { StoriesService } from './stories.service';

function story(id: number) {
  return {
    id,
    title: `t${id}`,
    content: '',
    images: [],
    createdAt: new Date('2026-06-09T00:00:00Z'),
    author: { username: 'u', avatar: null },
    _count: { likes: 0, comments: 0 },
  };
}

function mockPrisma() {
  return {
    story: { findMany: jest.fn(), findUnique: jest.fn() },
    like: { findMany: jest.fn() },
    favorite: { findUnique: jest.fn() },
  } as any;
}

describe('StoriesService.findMine', () => {
  it('按 authorId 过滤并回填 liked', async () => {
    const prisma = mockPrisma();
    prisma.story.findMany.mockResolvedValue([
      { ...story(1), _count: { likes: 2, comments: 1 } },
    ]);
    prisma.like.findMany.mockResolvedValue([{ storyId: 1 }]);
    const svc = new StoriesService(prisma);
    const res = await svc.findMine('u1');
    expect(prisma.story.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: 'u1' } }),
    );
    expect(res[0]).toMatchObject({
      id: 1,
      likeCount: 2,
      commentCount: 1,
      liked: true,
    });
  });
});

describe('StoriesService.findLiked', () => {
  it('无点赞 → 返回空数组，不查 story', async () => {
    const prisma = mockPrisma();
    prisma.like.findMany.mockResolvedValue([]);
    const svc = new StoriesService(prisma);
    expect(await svc.findLiked('u1')).toEqual([]);
    expect(prisma.story.findMany).not.toHaveBeenCalled();
  });

  it('按点赞时间顺序重排，liked 恒为 true', async () => {
    const prisma = mockPrisma();
    // 点赞时间倒序：story 3 在前、story 1 在后
    prisma.like.findMany.mockResolvedValue([{ storyId: 3 }, { storyId: 1 }]);
    // story.findMany 返回乱序
    prisma.story.findMany.mockResolvedValue([story(1), story(3)]);
    const svc = new StoriesService(prisma);
    const res = await svc.findLiked('u1');
    expect(res.map((r) => r.id)).toEqual([3, 1]);
    expect(res.every((r) => r.liked === true)).toBe(true);
  });
});

describe('StoriesService.findOne 收藏回填', () => {
  const detailRow = (id: number) => ({ ...story(id), comments: [] });

  it('登录且已收藏 → favorited:true（按 story 复合键查 Favorite）', async () => {
    const prisma = mockPrisma();
    prisma.story.findUnique.mockResolvedValue(detailRow(11));
    prisma.like.findMany.mockResolvedValue([]);
    prisma.favorite.findUnique.mockResolvedValue({ id: 99 });
    const svc = new StoriesService(prisma);
    const res = await svc.findOne(11, 'u1');
    expect(prisma.favorite.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_itemType_itemId: { userId: 'u1', itemType: 'story', itemId: 11 },
        },
      }),
    );
    expect(res.favorited).toBe(true);
  });

  it('未登录 → favorited:false，且不查 Favorite', async () => {
    const prisma = mockPrisma();
    prisma.story.findUnique.mockResolvedValue(detailRow(11));
    prisma.like.findMany.mockResolvedValue([]);
    const svc = new StoriesService(prisma);
    const res = await svc.findOne(11);
    expect(res.favorited).toBe(false);
    expect(prisma.favorite.findUnique).not.toHaveBeenCalled();
  });
});
