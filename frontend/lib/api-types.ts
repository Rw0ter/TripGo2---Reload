// 后端返回的数据结构（与 backend Prisma 模型对应）。

export interface Banner {
  id: number;
  image: string; // 本地资源 key，见 lib/legacy-images.ts
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
