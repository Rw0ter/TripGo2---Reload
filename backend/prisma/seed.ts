import { PrismaClient } from '@prisma/client';

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
  { image: 'top_AD.png', sort: 0 },
  { image: 'top_AD2.png', sort: 1 },
  { image: 'top_AD3.png', sort: 2 },
];

// 景点。section=home：hot=true 进首页人气榜大横卡，hot=false 进首页瀑布流；
// section=poi：进行程页的城市精选。
const scenics = [
  { name: '广州塔', image: 'jd/gz.jpg', city: '广州', summary: '', tag: '', note: '', hot: true, section: 'home', sort: 0 },
  { name: '欢乐谷', image: 'jd/gzcl.png', city: '广州', summary: '', tag: '', note: '', hot: true, section: 'home', sort: 1 },
  { name: '长隆海洋王国', image: 'changlong.png', city: '珠海', summary: '', tag: '', note: '', hot: true, section: 'home', sort: 2 },
  { name: '鼎湖山', image: 'dxs.jpg', city: '肇庆', summary: '', tag: '', note: '', hot: true, section: 'home', sort: 3 },
  { name: '岭南非遗殿堂', image: 'jd/gdsfwzwhycg.png', city: '潮州', summary: '岭南非遗殿堂，一馆尽览千年匠心与风华', tag: '', note: '', hot: false, section: 'home', sort: 0 },
  { name: '丹霞山', image: 'jd/dxs.png', city: '丹霞山', summary: '来丹霞山，观“色如渥丹”的赤壁，览“灿若明霞”的奇景', tag: '', note: '', hot: false, section: 'home', sort: 1 },
  { name: '南粤乡村', image: 'jd/nsthg.png', city: '广州', summary: '着重助力乡村振兴 汇聚岭南文化特色', tag: '', note: '', hot: false, section: 'home', sort: 2 },
  { name: '岭南印象园', image: 'jd/lnyxy.png', city: '广州', summary: '访岭南印象园，赏古建、品非遗、尝粤味', tag: '', note: '', hot: false, section: 'home', sort: 3 },
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
  console.log(
    `已 seed：文创 ${destinations.length} / 轮播 ${banners.length} / 景点 ${scenics.length} / 课堂 ${quizzes.length}`,
  );
}

main()
  .catch((e) => {
    console.error('seed 失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
