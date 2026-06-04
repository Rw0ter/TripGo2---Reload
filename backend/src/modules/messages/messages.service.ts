import { Injectable } from '@nestjs/common';

// 消息演示数据（不持久化，后续可扩展为 Prisma 模型）。
const DEMO_MESSAGES = [
  { id: 1, type: 'system', title: '欢迎加入文脉粤游', text: '探索岭南非遗文化，开启你的文化之旅！', time: '2026-06-03 09:00', unread: false },
  { id: 2, type: 'like', title: '新的点赞', text: '你的动态「广绣体验日记」被 岭南行者 点赞了', time: '2026-06-02 14:30', unread: true },
  { id: 3, type: 'comment', title: '新的评论', text: '文化爱好者 评论了你的动态：\"写得真好！\"', time: '2026-06-02 11:20', unread: true },
  { id: 4, type: 'order', title: '订单已发货', text: '你的文创产品「广绣团扇」已发货，预计 3 天送达', time: '2026-06-01 16:00', unread: false },
  { id: 5, type: 'system', title: '积分到账', text: '签到成功，获得 10 积分！', time: '2026-06-01 08:00', unread: false },
  { id: 6, type: 'like', title: '新的点赞', text: '潮汕阿明 点赞了你的故事「工夫茶的一天」', time: '2026-05-31 20:15', unread: false },
  { id: 7, type: 'system', title: '活动提醒', text: '端午龙舟赛即将开始，点击查看详情', time: '2026-05-30 10:00', unread: false },
  { id: 8, type: 'comment', title: '评论回复', text: '粤剧传承人回复了你的评论', time: '2026-05-29 15:45', unread: false },
];

@Injectable()
export class MessagesService {
  findAll(tab?: string) {
    let list = DEMO_MESSAGES;
    if (tab && tab !== 'all') list = list.filter((m) => m.type === tab);
    return { list, unreadCount: list.filter((m) => m.unread).length };
  }
}
