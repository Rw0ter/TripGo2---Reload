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

async function main() {
  // 幂等：清空后重插，便于反复跑
  await prisma.destination.deleteMany();
  await prisma.destination.createMany({ data: destinations });
  console.log(`已 seed ${destinations.length} 条文创产品`);
}

main()
  .catch((e) => {
    console.error('seed 失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
