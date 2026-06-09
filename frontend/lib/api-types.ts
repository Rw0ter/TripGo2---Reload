// 后端返回的数据结构（与 backend Prisma 模型对应）。

export interface Banner {
  id: number;
  image: string; // 本地资源 key，见 lib/legacy-images.ts
  title: string; // 浮层主标题
  subtitle: string; // 浮层副标题
  sort: number;
}

export interface Scenic {
  id: number;
  name: string;
  image: string; // 本地资源 key
  city: string;
  summary: string;
  tag: string;
  note: string;
  hot: boolean;
  section: string; // home 首页景点 / poi 行程城市精选
  price: number; // 预订估算价（元），下单时服务端据此定价
  sort: number;
}

export interface Quiz {
  id: number;
  tag: string;
  title: string;
  desc: string;
  btn: string;
  sort: number;
}

export interface StoryAuthor {
  username: string;
  avatar: string | null;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  images: string[]; // 本地资源 key，见 lib/legacy-images.ts
  createdAt: string; // ISO 时间串
  author: StoryAuthor;
  likeCount: number;
  commentCount: number;
  liked: boolean; // 当前用户是否已点赞（未登录恒 false）
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string; // ISO 时间串
  author: StoryAuthor;
}

// 动态详情：在列表字段基础上附评论列表，对应 GET /stories/:id。
export interface StoryDetail extends Story {
  favorited: boolean; // 当前用户是否已收藏（未登录恒 false）
  comments: Comment[];
}
