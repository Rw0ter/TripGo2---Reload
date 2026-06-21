import { Injectable } from '@nestjs/common';

// 消息演示数据（不持久化，后续可扩展为 Prisma 模型）。
const DEMO_MESSAGES = [
  { id: 1, type: 'system', title: '欢迎加入绿途', text: '开启绿色低碳生活，从今天的第一份碳积分开始！', time: '2026-06-03 09:00', unread: false },
  { id: 2, type: 'like', title: '新的点赞', text: '你的动态「我的一周绿色出行」被 低碳行者 点赞了', time: '2026-06-02 14:30', unread: true },
  { id: 3, type: 'comment', title: '新的评论', text: '环保达人 评论了你的动态：写得真好！', time: '2026-06-02 11:20', unread: true },
  { id: 4, type: 'order', title: '订单已发货', text: '你的生态良品「可降解环保餐具套装」已发货，预计 3 天送达', time: '2026-06-01 16:00', unread: false },
  { id: 5, type: 'system', title: '碳积分到账', text: '签到成功，获得 10 碳积分！', time: '2026-06-01 08:00', unread: false },
  { id: 6, type: 'like', title: '新的点赞', text: '节能小明 点赞了你的故事「我的低碳一天」', time: '2026-05-31 20:15', unread: false },
  { id: 7, type: 'system', title: '活动提醒', text: '世界环境日植树活动即将开始，点击查看详情', time: '2026-05-30 10:00', unread: false },
  { id: 8, type: 'comment', title: '评论回复', text: '环保志愿者回复了你的评论', time: '2026-05-29 15:45', unread: false },
];

@Injectable()
export class MessagesService {
  findAll(tab?: string) {
    let list = DEMO_MESSAGES;
    if (tab && tab !== 'all') list = list.filter((m) => m.type === tab);
    return { list, unreadCount: list.filter((m) => m.unread).length };
  }
}
