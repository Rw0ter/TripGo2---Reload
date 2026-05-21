import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 文创产品种子数据（迁移自旧版 destinations.json）。
// type：1 古筝工艺 / 2 曲艺周边 / 3 陶瓷玉雕 / 4 书画印刷 / 5 民俗手作 / 6 广东特产。
const destinations = [
  { title: '潮州木雕书签', image: '/resources/img/wccpImg/czmdsq.png', money: '58.00', number: '312', type: 1 },
  { title: '广式云雀古筝模型', image: '/resources/img/wccpImg/gsyqgzmx.png', money: '128.00', number: '256', type: 1 },
  { title: '岭南黄花梨迷你古筝', image: '/resources/img/wccpImg/lnhhlmngz.png', money: '198.00', number: '143', type: 1 },
  { title: '佛山伽蓝古筝琴码摆件', image: '/resources/img/wccpImg/fsjlgzqmbj.png', money: '78.00', number: '298', type: 1 },
  { title: '广州珠江古筝微雕挂饰', image: '/resources/img/wccpImg/gzzjgzwdgs.png', money: '98.00', number: '205', type: 1 },
  { title: '南海黑檀木古筝笔筒', image: '/resources/img/wccpImg/nhhtmgzbt.png', money: '68.00', number: '176', type: 1 },
  { title: '粤剧脸谱竹扇', image: '/resources/img/wccpImg/yjlpzs.png', money: '48.00', number: '412', type: 2 },
  { title: '广州粤曲演唱光盘套装', image: '/resources/img/wccpImg/gzyqycgptz.png', money: '88.00', number: '289', type: 2 },
  { title: '潮汕潮剧布偶公仔', image: '/resources/img/wccpImg/cscjbogz.png', money: '128.00', number: '197', type: 2 },
  { title: '珠三角曲艺剪纸挂件', image: '/resources/img/wccpImg/zsjqyjzgj.png', money: '38.00', number: '521', type: 2 },
  { title: '广州粤乐唱盘艺术画', image: '/resources/img/wccpImg/gzylcpysh.png', money: '158.00', number: '134', type: 2 },
  { title: '南海木偶戏手办', image: '/resources/img/wccpImg/nhmoxsb.jpg', money: '198.00', number: '162', type: 2 },
  { title: '佛山彩绘陶瓷花瓶', image: '/resources/img/wccpImg/fschtchp.jpg', money: '168.00', number: '284', type: 3 },
  { title: '潮州紫砂茶具套装', image: '/resources/img/wccpImg/czzscjtz.png', money: '298.00', number: '109', type: 3 },
  { title: '广州岭南剪纸艺术框', image: '/resources/img/wccpImg/gzlnjzysk.png', money: '78.00', number: '333', type: 3 },
  { title: '潮汕雕瓷摆件', image: '/resources/img/wccpImg/csdcbj.png', money: '198.00', number: '212', type: 3 },
  { title: '广州玉雕手链', image: '/resources/img/wccpImg/gzydsl.png', money: '248.00', number: '154', type: 3 },
  { title: '深圳硬木手工家具模型', image: '/resources/img/wccpImg/szymsgjjmx.jpg', money: '328.00', number: '89', type: 3 },
  { title: '潮州木版水印年画', image: '/resources/img/wccpImg/czmbsynh.png', money: '58.00', number: '467', type: 4 },
  { title: '广州琉璃彩绘挂件', image: '/resources/img/wccpImg/gzllchgj.png', money: '88.00', number: '398', type: 4 },
  { title: '佛山岭南彩墨山水画', image: '/resources/img/wccpImg/fslncmssh.png', money: '198.00', number: '176', type: 4 },
  { title: '深圳原创插画明信片', image: '/resources/img/wccpImg/szycchmxp.jpg', money: '28.00', number: '622', type: 4 },
  { title: '广州水彩花鸟挂画', image: '/resources/img/wccpImg/gzschngh.png', money: '138.00', number: '215', type: 4 },
  { title: '珠海贝壳马赛克画', image: '/resources/img/wccpImg/zhbkmskh.png', money: '158.00', number: '143', type: 4 },
  { title: '潮汕纸扎花灯模型', image: '/resources/img/wccpImg/cszzhdmx.png', money: '68.00', number: '524', type: 5 },
  { title: '广州醒狮工艺头盔', image: '/resources/img/wccpImg/gzxsgytk.png', money: '198.00', number: '131', type: 5 },
  { title: '佛山龙舟赛纪念摆件', image: '/resources/img/wccpImg/fslzsjnbj.png', money: '88.00', number: '269', type: 5 },
  { title: '南海年节灯谜手工卡', image: '/resources/img/wccpImg/nhnjdmsgk.png', money: '38.00', number: '712', type: 5 },
  { title: '潮汕牛肉丸手工礼盒', image: '/resources/img/wccpImg/csnrwsglh.png', money: '128.00', number: '198', type: 5 },
  { title: '广州传统风筝手绘套装', image: '/resources/img/wccpImg/gzctfzshtz.png', money: '78.00', number: '345', type: 5 },
  { title: '广式腊肠农家自制', image: '/resources/img/wccpImg/gslcnjzz.png', money: '18.80', number: '547', type: 6 },
  { title: '潮汕手打牛肉丸', image: '/resources/img/wccpImg/cssdnrw.png', money: '88.80', number: '778', type: 6 },
  { title: '东莞米粉干细粉丝', image: '/resources/img/wccpImg/dgmfgxfs.png', money: '18.80', number: '559', type: 6 },
  { title: '佛山盲公饼', image: '/resources/img/wccpImg/fsmgb.png', money: '19.90', number: '443', type: 6 },
  { title: '大良蹦砂', image: '/resources/img/wccpImg/dlbs.png', money: '22.00', number: '996', type: 6 },
  { title: '潮州凤凰单丛茶', image: '/resources/img/wccpImg/czfhdcc.png', money: '99.00', number: '886', type: 6 },
  { title: '十年新会陈皮', image: '/resources/img/wccpImg/snxhcp.png', money: '128.00', number: '669', type: 6 },
  { title: '广东妃子笑荔枝', image: '/resources/img/wccpImg/gdfzxlz.png', money: '49.00', number: '699', type: 6 },
  { title: '梅州客家梅菜干', image: '/resources/img/wccpImg/mzkjcmg.png', money: '12.80', number: '544', type: 6 },
];

// 首页轮播图。image 为前端本地资源 key（assets/legacy/img 下相对路径）。
const banners = [
  { image: 'xc/xc_guangzhou.jpg', title: '广州', subtitle: '珠水夜韵 · 羊城新貌', sort: 0 },
  { image: 'xc/xc_shenzhen.jpg', title: '深圳', subtitle: '湾区之光 · 创新之城', sort: 1 },
  { image: 'xc/xc_zhuhai.jpg', title: '珠海', subtitle: '日月贝畔 · 浪漫滨海', sort: 2 },
  { image: 'xc/xc_chaozhou.jpeg', title: '潮州', subtitle: '韩江古城 · 千年潮韵', sort: 3 },
];

// 景点。section=home：hot=true 进首页人气榜大横卡，hot=false 进首页瀑布流；
// section=poi：进行程页的城市精选。
const scenics = [
  // 热门景点（首页大横卡）
  { name: '广州塔', image: 'jd/gz.jpg', city: '广州', summary: '小蛮腰夜景，珠江畔的城市地标', tag: '', note: '', hot: true, section: 'home', sort: 0 },
  { name: '丹霞山', image: 'jd/dxs.png', city: '韶关', summary: '色如渥丹，灿若明霞的丹霞奇观', tag: '', note: '', hot: true, section: 'home', sort: 1 },
  { name: '长隆海洋王国', image: 'changlong.png', city: '珠海', summary: '亲子必打卡的世界级海洋乐园', tag: '', note: '', hot: true, section: 'home', sort: 2 },
  { name: '欢乐谷', image: 'jd/gzcl.png', city: '广州', summary: '刺激与欢乐并存的主题乐园', tag: '', note: '', hot: true, section: 'home', sort: 3 },
  // 城市精选（首页瀑布流）
  { name: '东莞', image: 'xc/xc_dongguan.jpg', city: '东莞', summary: '篮球之城，国贸潮购与岭南古韵', tag: '', note: '', hot: false, section: 'home', sort: 0 },
  { name: '惠州', image: 'xc/xc_huizhou.jpg', city: '惠州', summary: '半城山色半城湖，西湖泛舟', tag: '', note: '', hot: false, section: 'home', sort: 1 },
  { name: '江门', image: 'xc/xc_jiangmen.jpg', city: '江门', summary: '侨乡碉楼，赤坎古镇的时光剪影', tag: '', note: '', hot: false, section: 'home', sort: 2 },
  { name: '河源', image: 'xc/xc_heyuan.png', city: '河源', summary: '万绿湖畔，恐龙故乡的青山绿水', tag: '', note: '', hot: false, section: 'home', sort: 3 },
  { name: '清远', image: 'xc/xc_qingyuan.jpg', city: '清远', summary: '北江画廊，温泉峡谷漂流胜地', tag: '', note: '', hot: false, section: 'home', sort: 4 },
  { name: '肇庆', image: 'xc/xc_zhaoqing.jpg', city: '肇庆', summary: '七星岩映月，鼎湖山天然氧吧', tag: '', note: '', hot: false, section: 'home', sort: 5 },
  { name: '揭阳', image: 'xc/xc_jieyang.jpeg', city: '揭阳', summary: '岭南水城，进贤门下的潮味烟火', tag: '', note: '', hot: false, section: 'home', sort: 6 },
  { name: '梅州', image: 'xc/xc_meizhou.jpg', city: '梅州', summary: '客家围龙屋，世界长寿之乡', tag: '', note: '', hot: false, section: 'home', sort: 7 },
  // 行程城市精选 POI
  { name: '东莞虎门大桥', image: 'dghmdq.jpg', city: '东莞', summary: '东莞虎门大桥！极具艺术性，创造历史…', tag: '文史口碑馆', note: '📷 16 个上榜项', hot: false, section: 'poi', sort: 0 },
  { name: '东莞战争博物馆', image: 'dgypzzbwg.png', city: '东莞', summary: '东莞照片战争博物馆，观展珍贵文献文物…', tag: '文史口碑馆', note: '📷 16 个上榜项', hot: false, section: 'poi', sort: 1 },
  { name: '山谷古村落', image: 'gysgjslgy.png', city: '东莞', summary: '隐秘山谷里的古村落，周末走走…', tag: '文史口碑馆', note: '📷 12 个上榜项', hot: false, section: 'poi', sort: 2 },
];

// 首页知识小课堂答题卡。
const quizzes = [
  { tag: '积分翻倍场', title: '非遗文化挑战', desc: '限时答题赢最高 88 积分，适合新手快速上分', btn: '立即开始挑战', sort: 0 },
  { tag: '经典问答', title: '粤剧知识问答', desc: '边看边答，解锁戏台幕后冷知识，累计非遗积分', btn: '进入答题房间', sort: 1 },
  { tag: '进阶挑战', title: '广绣工艺挑战', desc: '模拟绣线步骤答题，通关可解锁专属勋章与好礼', btn: '去闯关赢好礼', sort: 2 },
  { tag: '人气专场', title: '岭南美食问答', desc: '一边馋一边答，解锁早茶、煲汤与街头小吃冷知识', btn: '马上去答题', sort: 3 },
];

// 社区动态作者（演示用户，密码统一 123456）。
const communityAuthors = [
  { username: '岭南阿May', email: 'amay@tripgo.demo' },
  { username: '老广日记', email: 'laoguang@tripgo.demo' },
  { username: '潮味食客', email: 'chaowei@tripgo.demo' },
  { username: '山客随行', email: 'shanke@tripgo.demo' },
  { username: '骑楼下的猫', email: 'qilou@tripgo.demo' },
  { username: '早茶续命中', email: 'zaocha@tripgo.demo' },
  { username: '龙舟少年', email: 'longzhou@tripgo.demo' },
  { username: '醒狮阿强', email: 'xingshi@tripgo.demo' },
];

// 社区动态。images 为前端本地资源 key；authorIdx 指向 communityAuthors。
const storyDefs = [
  {
    authorIdx: 0,
    title: '夜爬小蛮腰，把广州的灯都看了一遍',
    content:
      '傍晚六点上的广州塔，刚好赶上珠江两岸亮灯。摩天轮转到最高点时整座城像撒了一把碎金，强烈建议挑工作日来，人少风也凉。',
    images: ['jd/gz.jpg'],
  },
  {
    authorIdx: 3,
    title: '丹霞山日出，值得四点半起床',
    content:
      '凌晨摸黑爬到观日亭，云海在脚下翻。第一缕光打在赤红的山体上那一下，真的会起鸡皮疙瘩。下山记得带件外套。',
    images: ['jd/dxs.png'],
  },
  {
    authorIdx: 2,
    title: '潮州牌坊街，一路吃到扶墙走',
    content:
      '蚝烙、鸭母捻、腐乳饼、手打牛肉丸……牌坊街从头吃到尾，胃都不够用。最爱巷子里那家凤凰单丛，老板冲茶的手法像表演。',
    images: ['xc/xc_chaozhou.jpeg'],
  },
  {
    authorIdx: 1,
    title: '带娃打卡长隆海洋王国',
    content:
      '鲸鲨馆里小朋友盯着看了半小时不肯走，花车巡游也很好出片。建议早上开园就冲热门项目，下午留给室内馆避暑。',
    images: ['changlong.png'],
  },
  {
    authorIdx: 4,
    title: '江门侨乡，碉楼里藏着一整个时代',
    content:
      '赤坎古镇的骑楼一栋挨一栋，斑驳的墙面上还留着当年的招牌。在巷口喝了碗陈皮绿豆沙，慢悠悠晃了一下午。',
    images: ['xc/xc_jiangmen.jpg'],
  },
  {
    authorIdx: 3,
    title: '肇庆七星岩，城市边上的山水画',
    content:
      '环湖骑行一圈很舒服，岩峰倒映在湖面，随手一拍都是壁纸。鼎湖山负氧离子拉满，适合周末来洗洗肺。',
    images: ['xc/xc_zhaoqing.jpg', 'xc/xc_qingyuan.jpg'],
  },
  {
    authorIdx: 5,
    title: '在深圳，逛展和喝早茶并不冲突',
    content:
      '上午在湾区看了场设计展，中午拐进老街找了家茶楼，虾饺烧麦凤爪一字排开。新与旧在这座城市贴得很近。',
    images: ['xc/xc_shenzhen.jpg'],
  },
  {
    authorIdx: 6,
    title: '梅州围龙屋，客家人的向心力',
    content:
      '第一次走进围龙屋，半圆形的屋舍把祠堂围在正中间，一族人住一栋楼。屋里阿婆给我盛了碗腌面，热乎乎的。',
    images: ['xc/xc_meizhou.jpg'],
  },
];

// 评论文案池。
const commentTexts = [
  '太想去了，已加入收藏清单！',
  '图拍得真好看，求机位～',
  '上周刚去过，确实绝',
  '广东真的怎么逛都逛不完',
  '请问大概玩了几天呀？',
  '这条路线很适合周末',
];

// 社区动态相关数据（作者 upsert 保留已注册账号，动态/点赞/评论清空重插）。
async function seedCommunity() {
  const pw = await bcrypt.hash('123456', 10);
  const authors: { id: string }[] = [];
  for (const a of communityAuthors) {
    const u = await prisma.user.upsert({
      where: { username: a.username },
      update: {},
      create: { username: a.username, email: a.email, password: pw },
    });
    authors.push(u);
  }

  await prisma.story.deleteMany(); // 级联清空 like / comment
  // 时间错开，动态流的「x 小时/天前」更自然。
  const hoursAgo = [1, 4, 9, 19, 30, 49, 73, 102];
  const stories: { id: number }[] = [];
  for (let i = 0; i < storyDefs.length; i += 1) {
    const s = storyDefs[i];
    const row = await prisma.story.create({
      data: {
        title: s.title,
        content: s.content,
        images: s.images,
        authorId: authors[s.authorIdx].id,
        createdAt: new Date(Date.now() - hoursAgo[i] * 3_600_000),
      },
    });
    stories.push(row);
  }

  // 点赞：每条动态被一部分作者点赞，计数随动态错开（3~7 个）。
  const likeData: { storyId: number; userId: string }[] = [];
  stories.forEach((st, j) => {
    authors.forEach((au, i) => {
      if ((i * 3 + j * 5) % 8 < 3 + (j % 5)) {
        likeData.push({ storyId: st.id, userId: au.id });
      }
    });
  });
  await prisma.like.createMany({ data: likeData });

  // 评论：每条动态 1~3 条。
  const commentData: { storyId: number; authorId: string; text: string }[] = [];
  stories.forEach((st, j) => {
    for (let k = 0; k < 1 + (j % 3); k += 1) {
      commentData.push({
        storyId: st.id,
        authorId: authors[(j + k + 1) % authors.length].id,
        text: commentTexts[(j * 2 + k) % commentTexts.length],
      });
    }
  });
  await prisma.comment.createMany({ data: commentData });

  return { authors: authors.length, stories: stories.length };
}

async function main() {
  // 幂等：清空后重插，便于反复跑
  await prisma.destination.deleteMany();
  await prisma.destination.createMany({ data: destinations });
  await prisma.banner.deleteMany();
  await prisma.banner.createMany({ data: banners });
  await prisma.scenic.deleteMany();
  await prisma.scenic.createMany({ data: scenics });
  await prisma.quiz.deleteMany();
  await prisma.quiz.createMany({ data: quizzes });
  const community = await seedCommunity();
  console.log(
    `已 seed：文创 ${destinations.length} / 轮播 ${banners.length} / 景点 ${scenics.length} / 课堂 ${quizzes.length} / 社区作者 ${community.authors} / 动态 ${community.stories}`,
  );
}

main()
  .catch((e) => {
    console.error('seed 失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
