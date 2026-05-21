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
