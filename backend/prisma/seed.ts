import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 生态良品种子数据（迁移自旧版 destinations.json，改为绿色低碳产品）。
// type：1 环保餐具 / 2 绿色家居 / 3 清洁用品 / 4 再生制品 / 5 有机食品 / 6 节能数码。
const destinations = [
  // ── 1 环保餐具 ──
  { title: '天然竹纤维餐具套装', image: '/resources/img/wccpImg/czmdsq.png', money: '68.00', number: '512', type: 1, description: '天然竹纤维模压成型，可自然降解，不含 BPA，适合户外野餐和日常使用', detail: '材质：竹纤维+玉米淀粉；套装含碗/盘/杯/筷/勺' },
  { title: '不锈钢环保吸管套装', image: '/resources/img/wccpImg/gsyqgzmx.png', money: '38.00', number: '728', type: 1, description: '304 食品级不锈钢，含直管+弯管+清洁刷+收纳袋，可重复使用数千次', detail: '材质：304不锈钢；含4件套；可替代约500根一次性塑料吸管' },
  { title: '麦秆纤维便携餐盒', image: '/resources/img/wccpImg/lnhhlmngz.png', money: '45.00', number: '443', type: 1, description: '天然麦秆纤维+PP 共混，轻便耐用，微波可用，替代一次性塑料饭盒', detail: '材质：麦秆纤维+食品级PP；容量800ml；耐温-20°C~120°C' },
  { title: '可降解玉米淀粉杯', image: '/resources/img/wccpImg/fsjlgzqmbj.png', money: '25.00', number: '889', type: 1, description: 'PLA 玉米淀粉材质，工业堆肥条件下 90 天降解，适合冷热饮', detail: '材质：PLA聚乳酸；6个装；耐温50°C以下' },
  { title: '木质便携筷子礼盒', image: '/resources/img/wccpImg/gzzjgzwdgs.png', money: '35.00', number: '634', type: 1, description: '天然檀木手工打磨，配收纳布袋，告别一次性筷子', detail: '材质：天然檀木；含筷子+布袋；可重复使用多年' },
  { title: '硅胶折叠咖啡杯', image: '/resources/img/wccpImg/nhhtmgzbt.png', money: '79.00', number: '321', type: 1, description: '食品级硅胶，折叠后仅 4cm 厚，随身携带替代纸杯', detail: '材质：食品级硅胶+PP杯盖；容量350ml；可折叠设计' },

  // ── 2 绿色家居 ──
  { title: '有机棉四件套床品', image: '/resources/img/wccpImg/yjlpzs.png', money: '328.00', number: '156', type: 2, description: 'GOTS 认证有机棉，零农药种植，比常规棉减碳 46%', detail: '材质：100%有机棉；含床单+被套+枕套×2；多色可选' },
  { title: 'LED 智能护眼台灯', image: '/resources/img/wccpImg/gzyqycgptz.png', money: '198.00', number: '289', type: 2, description: '比白炽灯节电 80%，寿命 25000 小时，无频闪自然光', detail: '功率：8W；色温：3000K-6500K可调；USB充电口' },
  { title: '天然乳胶枕', image: '/resources/img/wccpImg/cscjbogz.png', money: '168.00', number: '412', type: 2, description: '泰国天然乳胶，无合成胶，透气抗菌，可生物降解', detail: '材质：天然乳胶；高度可选；配有机棉枕套' },
  { title: '太阳能户外壁灯', image: '/resources/img/wccpImg/zsjqyjzgj.png', money: '88.00', number: '567', type: 2, description: '太阳能充电+人体感应，零电费，IP65 防水，自动亮灭', detail: '功率：3W；太阳能板：5V/1W；感应距离3-5米' },
  { title: '水培室内绿植套装', image: '/resources/img/wccpImg/gzylcpysh.png', money: '99.00', number: '378', type: 2, description: '无土栽培，自吸水花盆，净化空气，办公桌的绿色伴侣', detail: '含花盆+基质+种子；可选绿萝/薄荷/罗勒' },
  { title: '天然除湿竹炭包', image: '/resources/img/wccpImg/nhmoxsb.jpg', money: '29.00', number: '892', type: 2, description: '天然竹炭，吸湿除味，可日晒再生重复使用一年以上', detail: '材质：天然竹炭；4包装；每包200g' },

  // ── 3 清洁用品 ──
  { title: '可降解垃圾袋', image: '/resources/img/wccpImg/fschtchp.jpg', money: '19.90', number: '1456', type: 3, description: '玉米淀粉 PBAT 共混，堆肥条件 90 天降解，比普通塑料袋减碳 70%', detail: '材质：PBAT+玉米淀粉；45×50cm；50只装' },
  { title: '无患子天然洗涤剂', image: '/resources/img/wccpImg/czzscjtz.png', money: '32.00', number: '623', type: 3, description: '无患子果实天然皂苷，可用于洗衣/洗碗/洗手/洗发，零化学污染', detail: '成分：100%无患子提取物；500ml；可自然降解' },
  { title: '天然海绵沐浴球', image: '/resources/img/wccpImg/gzlnjzysk.png', money: '28.00', number: '534', type: 3, description: '地中海天然海绵，可生物降解，替代塑料浴球', detail: '材质：天然海绵；直径8-10cm；可持续采收' },
  { title: '柠檬酸除垢清洁剂', image: '/resources/img/wccpImg/csdcbj.png', money: '15.00', number: '987', type: 3, description: '食品级柠檬酸，天然除垢去水渍，替代化学清洁剂', detail: '成分：食品级柠檬酸；500g装；可用于水壶/咖啡机/浴室' },
  { title: '竹纤维洗碗布', image: '/resources/img/wccpImg/gzydsl.png', money: '18.00', number: '1123', type: 3, description: '天然竹纤维，吸水去油不粘腻，用后可堆肥降解', detail: '材质：竹纤维；10片装；可机洗重复使用' },
  { title: '固体洗发皂', image: '/resources/img/wccpImg/szymsgjjmx.jpg', money: '45.00', number: '456', type: 3, description: '天然植物油冷制，无塑料瓶包装，一块皂 = 3 瓶洗发水', detail: '成分：椰子油/橄榄油/蓖麻油；适合中性发质；80g' },

  // ── 4 再生制品 ──
  { title: '回收 PET 双肩包', image: '/resources/img/wccpImg/czmbsynh.png', money: '158.00', number: '267', type: 4, description: '12 个回收塑料瓶制成，rPET 面料，碳排放比原生聚酯纤维减 75%', detail: '材质：100%再生PET；防水耐磨；容量20L' },
  { title: '再生纸手工笔记本', image: '/resources/img/wccpImg/gzllchgj.png', money: '28.00', number: '734', type: 4, description: '100% 消费后回收废纸，大豆油墨印刷，节约造纸用水 60%', detail: '材质：再生纸；A5尺寸；80页；可回收' },
  { title: '旧轮胎再生橡胶地垫', image: '/resources/img/wccpImg/fslncmssh.png', money: '68.00', number: '345', type: 4, description: '回收废旧轮胎制成，耐磨防滑，室内外通用', detail: '材质：再生橡胶；50×80cm；防滑纹理' },
  { title: '回收牛仔布托特包', image: '/resources/img/wccpImg/szycchmxp.jpg', money: '88.00', number: '412', type: 4, description: '回收旧牛仔裤手工改造，每只独一无二，坚固耐用', detail: '材质：回收牛仔布；手工制作；可承重10kg' },
  { title: '再生塑料环保笔', image: '/resources/img/wccpImg/gzschngh.png', money: '12.00', number: '1890', type: 4, description: '再生 PP 塑料笔杆+可替换笔芯，6 支装', detail: '材质：再生PP塑料；0.5mm笔尖；6支装+替换芯×6' },
  { title: '回收玻璃花瓶', image: '/resources/img/wccpImg/zhbkmskh.png', money: '58.00', number: '523', type: 4, description: '回收啤酒瓶再造，手工吹制，每件纹理独一无二', detail: '材质：100%回收玻璃；手工吹制；高15-18cm' },

  // ── 5 有机食品 ──
  { title: '有机冷压椰子油', image: '/resources/img/wccpImg/cszzhdmx.png', money: '89.00', number: '667', type: 5, description: '有机椰子低温冷压萃取，可烹饪/护发/护肤，玻璃瓶包装可回收', detail: '容量：500ml；认证：USDA Organic；玻璃瓶装' },
  { title: '高山有机绿茶', image: '/resources/img/wccpImg/gzxsgytk.png', money: '128.00', number: '445', type: 5, description: '无农药高山茶园，手采一芽二叶，碳足迹比常规茶低 40%', detail: '净重：150g；产地：福建武夷山；有机认证' },
  { title: '公平贸易咖啡豆', image: '/resources/img/wccpImg/fslzsjnbj.png', money: '98.00', number: '334', type: 5, description: '公平贸易认证，小农合作社直供，收入回馈社区可持续发展', detail: '净重：250g；烘焙度：中深；产地：埃塞俄比亚' },
  { title: '有机杂粮礼盒', image: '/resources/img/wccpImg/nhnjdmsgk.png', money: '158.00', number: '289', type: 5, description: '有机认证小米/糙米/黑米/红豆/绿豆 5 种杂粮，牛皮纸包装', detail: '含5种杂粮；总净重2.5kg；无农药化肥种植' },
  { title: '野生蓝莓干', image: '/resources/img/wccpImg/csnrwsglh.png', money: '45.00', number: '723', type: 5, description: '大兴安岭野生蓝莓，无糖添加，自然晒干保留花青素', detail: '净重：200g；产地：大兴安岭；无添加剂' },
  { title: '蜂蜡保鲜布套装', image: '/resources/img/wccpImg/gzctfzshtz.png', money: '58.00', number: '556', type: 5, description: '有机棉布 + 天然蜂蜡，可重复使用一年，替代保鲜膜', detail: '含S/M/L 3片；材质：有机棉+蜂蜡+荷荷巴油；可降解' },

  // ── 6 节能数码 ──
  { title: '太阳能充电宝', image: '/resources/img/wccpImg/gslcnjzz.png', money: '168.00', number: '534', type: 6, description: '高效单晶硅光伏板，晴天 6 小时充满，一度太阳能减排 0.9kg CO₂', detail: '容量：20000mAh；光伏转化率22%；USB-C快充输出' },
  { title: '可充电锂电池套装', image: '/resources/img/wccpImg/cssdnrw.png', money: '89.00', number: '678', type: 6, description: '5 号+7 号各 4 节，可充放电 1000+ 次，一节替代千节一次性电池', detail: '含5号×4+7号×4+USB充电器；NiMH电池' },
  { title: '低功耗蓝牙温湿度计', image: '/resources/img/wccpImg/dgmfgxfs.png', money: '49.00', number: '890', type: 6, description: '一颗纽扣电池用一年，手机APP查看历史数据，智能家居必备', detail: '连接：BLE 5.0；精度：±0.3°C/±2%RH；APP实时同步' },
  { title: '可降解植物基手机壳', image: '/resources/img/wccpImg/fsmgb.png', money: '78.00', number: '456', type: 6, description: '亚麻纤维+玉米基 PLA，工业堆肥 180 天降解，支持无线充电', detail: '材质：PLA+亚麻纤维；兼容iPhone/华为/小米主流机型' },
  { title: '智能节能插座', image: '/resources/img/wccpImg/dlbs.png', money: '128.00', number: '345', type: 6, description: 'WiFi 远程控制+定时开关+电量统计，消灭待机功耗，月省电 10-20%', detail: '协议：WiFi 2.4G；最大功率：2500W；APP远程控制' },
  { title: '手摇发电应急收音机', image: '/resources/img/wccpImg/czfhdcc.png', money: '158.00', number: '234', type: 6, description: '手摇 1 分钟可用 30 分钟，太阳能+USB 三充，应急照明+SOS', detail: '含LED手电筒+SOS警报；内置2000mAh电池；FM/AM收音' },
];

// 首页轮播图。image 为前端本地资源 key（assets/legacy/img 下相对路径）。
const banners = [
  { image: 'banner/green_life', title: '绿色生活', subtitle: '低碳环保 · 从我做起', sort: 0 },
  { image: 'banner/carbon_neutral', title: '碳中和之路', subtitle: '2030碳达峰 · 2060碳中和', sort: 1 },
  { image: 'banner/ecology', title: '生态保护', subtitle: '绿水青山 · 金山银山', sort: 2 },
  { image: 'banner/clean_energy', title: '清洁能源', subtitle: '新能源革命 · 零碳未来', sort: 3 },
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

// 景点预订估算价（元）：按城市给一个合理价，下单时服务端按此定价。
function scenicPrice(city: string): number {
  const map: Record<string, number> = {
    广州: 200, 深圳: 380, 珠海: 520, 东莞: 320, 佛山: 350, 惠州: 400,
    汕头: 300, 潮州: 280, 梅州: 260, 韶关: 350, 肇庆: 380, 江门: 320,
    河源: 340, 清远: 420, 揭阳: 290,
  };
  return map[city] ?? 380;
}

// 首页知识小课堂答题卡。
const quizzes = [
  { tag: '碳积分专场', title: '碳排放知识挑战', desc: '答题赢碳积分，了解你的碳足迹数据', btn: '开始挑战', sort: 0 },
  { tag: '趣味问答', title: '垃圾分类知多少', desc: '你能分清可回收物、有害垃圾和厨余垃圾吗？', btn: '开始分类', sort: 1 },
  { tag: '进阶挑战', title: '生态系统知识赛', desc: '从雨林到海洋，测试你的生态环保知识', btn: '去闯关', sort: 2 },
  { tag: '能源专场', title: '清洁能源知多少', desc: '太阳能、风能、水能……你的新能源知识达标吗？', btn: '马上答题', sort: 3 },
];

// 社区动态作者（演示用户，密码统一 123456）。
const communityAuthors = [
  { username: '绿色生活家', email: 'greenlife@tripgo.demo' },
  { username: '低碳日记', email: 'lowcarbon@tripgo.demo' },
  { username: '零废弃达人', email: 'zerowaste@tripgo.demo' },
  { username: '骑行侠阿风', email: 'biker@tripgo.demo' },
  { username: '阳台农夫', email: 'farmer@tripgo.demo' },
  { username: '自然观察员', email: 'nature@tripgo.demo' },
  { username: '环保极客', email: 'ecogeek@tripgo.demo' },
  { username: '山海守护人', email: 'ocean@tripgo.demo' },
];

// 社区动态——绿色低碳生活主题。images 为前端本地资源 key；authorIdx 指向 communityAuthors。
const storyDefs = [
  {
    authorIdx: 0,
    title: '我的第一次垃圾分类挑战：从手忙脚乱到得心应手',
    content:
      '刚开始分的时候真的是手忙脚乱——外卖盒子是可回收还是其他？奶茶杯要洗吗？坚持了一个月之后已经本能反应了，连家里小朋友都会提醒大人「这个是可回收的」。垃圾分类真的不难，难的是迈出第一步。',
    images: ['story/waste_sort'],
  },
  {
    authorIdx: 1,
    title: '骑行通勤一个月，减碳数据超乎想象',
    content:
      '把车钥匙放家里，换上骑行服通勤了一个月。月末一算：每天来回 12 公里代替开车，一个月少排了约 110 kg CO₂，还省了 800 多块油钱。大腿明显紧实了，人也精神了不少。低碳生活其实挺省钱的。',
    images: ['story/bike_commute'],
  },
  {
    authorIdx: 4,
    title: '阳台种菜记：从种子到餐桌的零碳旅程',
    content:
      '在阳台用废弃的泡沫箱种了生菜、小番茄和薄荷。用的都是厨余堆肥，零化肥零农药。第一茬生菜摘下来拌沙拉的时候，那种成就感比外卖好吃一百倍。不仅省了买菜钱，还减少了食物运输的碳排放。',
    images: ['story/balcony_farm'],
  },
  {
    authorIdx: 3,
    title: '旧衣改造：一条牛仔裤的第二人生',
    content:
      '把压箱底的三条旧牛仔裤裁成了两个托特包 + 一个围裙，加上之前剩的扣子和碎花布做成装饰。朋友以为我买了什么设计师品牌。快时尚每年扔掉 9200 万吨纺织废弃物——其实好面料值得被重新利用。',
    images: ['story/upcycle'],
  },
  {
    authorIdx: 1,
    title: '家庭节电大作战：一个月省了 100 度电',
    content:
      '换了全屋 LED 灯泡、给空调设了定时、热水器加了定时开关、所有待机电器拔插头。一个月下来电费单少了 100 多度，按一度电 0.9 kg CO₂ 算，我们一家四口这个月减排了 90 kg。关键在于养成习惯！',
    images: ['story/save_energy'],
  },
  {
    authorIdx: 2,
    title: '拒绝一次性塑料的第 30 天',
    content:
      '挑战一个月不用一次性塑料：自带水杯、购物袋、餐具、硅胶保鲜盖。最难的是外卖——跟店家说不要餐具说了 20 次有 10 次还是放了。不过总体算下来这个月少扔了约 5 kg 塑料垃圾，坚持就是改变。',
    images: ['story/no_plastic'],
  },
  {
    authorIdx: 7,
    title: '周末净山行动：我们 12 个人捡了 20 公斤垃圾',
    content:
      '组织了一次社区净山，12 个人两小时在城郊的山道上捡了 20 多公斤垃圾——最多的就是塑料瓶和零食包装。捡完后站在山顶往下看，心里特别踏实。以后每月组织一次，欢迎附近的朋友一起加入！',
    images: ['story/cleanup'],
  },
  {
    authorIdx: 6,
    title: '碳足迹计算器让我看到了惊人的数字',
    content:
      '用 App 的碳足迹功能算了一下自己一年的排放：燃油车通勤 2.5 吨、红肉消费 1.1 吨、飞了两次国内航班 0.8 吨……总共一年排放约 8 吨 CO₂，远高于中国人均排放目标。看完数据我决定从下个月开始改变。',
    images: ['story/carbon'],
  },
];

// 评论文案池——贴合绿色低碳主题。
const commentTexts = [
  '太棒了！我也要开始这样的绿色生活',
  '看完觉得环保真的可以从身边小事做起',
  '请问这个活动在哪里参加的？想加入',
  '越了解碳足迹越觉得自己该行动了',
  '为坚持低碳生活的每一个普通人点赞',
  '已收藏，带着家人一起行动起来',
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

// 文化内容：粤语短语
const cantonesePhrases = [
  { category: 'phrase', title: '你好 (nei5 hou2)', subtitle: '你好', content: '👋', icon: '', color: '', sort: 0 },
  { category: 'phrase', title: '多謝 (do1 ze6)', subtitle: '谢谢', content: '🙏', icon: '', color: '', sort: 1 },
  { category: 'phrase', title: '唔該 (m4 goi1)', subtitle: '麻烦/谢谢', content: '😊', icon: '', color: '', sort: 2 },
  { category: 'phrase', title: '早晨 (zou2 san4)', subtitle: '早上好', content: '🌅', icon: '', color: '', sort: 3 },
  { category: 'phrase', title: '食咗飯未？(sik6 zo2 faan6 mei6)', subtitle: '吃饭了吗？', content: '🍚', icon: '', color: '', sort: 4 },
  { category: 'phrase', title: '好靚 (hou2 leng3)', subtitle: '很漂亮', content: '✨', icon: '', color: '', sort: 5 },
  { category: 'phrase', title: '慢慢行 (maan6 maan6 haang4)', subtitle: '慢走', content: '🚶', icon: '', color: '', sort: 6 },
  { category: 'phrase', title: '飲茶 (jam2 caa4)', subtitle: '喝茶/吃点心', content: '🍵', icon: '', color: '', sort: 7 },
];

// 文化内容：粤语课程
const cantoneseLessons = [
  { category: 'lesson', title: '粤语拼音入门', subtitle: '学习粤拼基本规则', content: '{"lessons":5}', icon: 'text', color: '#D4522A', sort: 0 },
  { category: 'lesson', title: '日常对话', subtitle: '问候、购物、出行', content: '{"lessons":10}', icon: 'chatbubbles', color: '#E0892F', sort: 1 },
  { category: 'lesson', title: '饮食文化', subtitle: '茶楼点餐、美食表达', content: '{"lessons":6}', icon: 'restaurant', color: '#5C8A6D', sort: 2 },
  { category: 'lesson', title: '岭南俗语', subtitle: '地道俚语和谚语', content: '{"lessons":8}', icon: 'book', color: '#7B68AE', sort: 3 },
];

// 文化内容：非遗学习主题。content 为 JSON：
//   { quizId, image(封面 key), gallery(画廊 key[]), intro, history, highlights[], funFact }
// 图优先用 Legacy 真实非遗照片（fyxx/*），缺图题材用联网补的 study/*（见前端 legacy-images.ts）。
const studyTopicSeed = [
  {
    title: '粤剧', subtitle: '岭南文化瑰宝，世界级非遗', quizId: 1, icon: 'musical-notes', color: '#C8161D', sort: 0,
    image: 'fyxx/yuejufm.jpg', gallery: ['fyxx/yueju1.jpg', 'fyxx/yueju2.jpg', 'fyxx/yueju3.jpg'],
    intro: '粤剧又称广东大戏，明清时期形成于珠江三角洲，融合梆子、二黄等声腔，唱念做打俱全，行当与脸谱十分讲究。2009 年被联合国教科文组织列入人类非物质文化遗产代表作名录，是岭南文化的标志性瑰宝。',
    history: '粤剧在弋阳腔、昆腔的基础上，融合广东民间音乐与粤语方言演变而成。清末民初名伶辈出，红船子弟沿珠江水路巡演，把粤剧带到广府的村镇市井，并随华侨远播东南亚与北美，成为海外乡音的寄托。',
    highlights: ['唱腔以梆子、二黄为骨，融入粤调小曲，婉转抑扬', '行当分生、旦、净、丑，脸谱与戏服色彩浓烈、纹样讲究', '做手、身段、把子功并重，文戏细腻、武戏火爆', '《帝女花》《紫钗记》等名剧传唱不衰'],
    funFact: '早年粤剧戏班乘「红船」沿江演出，艺人因此自称「红船子弟」，连洪拳武术都与红船渊源颇深。',
  },
  {
    title: '广绣', subtitle: '一针一线绣出岭南风华', quizId: 2, icon: 'color-palette', color: '#B01E2E', sort: 1,
    image: 'study/guangxiu.jpeg', gallery: ['study/guangxiu_1.jpg'],
    intro: '广绣是中国四大名绣中粤绣的重要分支，以构图饱满、色彩富丽、纹理清晰、针法多变著称。常以百鸟朝凤、荔枝木棉等岭南题材入绣，金银线垫绣立体生动，是广府工艺的代表。',
    history: '广绣即广府刺绣，与潮绣合称粤绣，名列中国四大名绣。唐代已有记载，明清时经广州十三行大量外销欧洲，被称作「中国绣」。绣工以构图丰满、用色明快、立体感强见长。',
    highlights: ['构图饱满繁复，常见百鸟朝凤、三阳开泰', '用色富丽，金银线垫绣令图案凸起、富立体感', '针法多变，「留水路」使层次分明、轮廓清晰', '题材浓郁岭南，花鸟果木皆可入绣'],
    funFact: '历史上广绣绣工以男性为主，行内称「花佬」，这在以女红为主的刺绣行当里相当少见。',
  },
  {
    title: '醒狮', subtitle: '威武雄壮，驱邪纳福', quizId: 3, icon: 'paw', color: '#D4453A', sort: 2,
    image: 'fyxx/yx.jpg', gallery: ['fyxx/yx1.jpg', 'fyxx/yx2.jpg'],
    intro: '醒狮属南狮，集武术、舞蹈、音乐于一体，狮头威武、眼帘灵动。逢年过节、开张庆典常以采青助兴，鼓点铿锵、腾挪跳跃，寓意驱邪纳福、生意兴隆，是岭南最具人气的民俗表演。',
    history: '醒狮即广东南狮，相传源于明代，盛行于珠三角与港澳。狮头以佛山、鹤山所制最为有名，造型威猛、色彩斑斓。2006 年列入第一批国家级非物质文化遗产。',
    highlights: ['狮头重彩描金，眉眼可动，神态灵活', '「采青」为高潮：寻青、采青、吐青，寓意生财', '梅花桩阵腾跃翻转，融武术与杂技于一体', '锣鼓点指挥全场，鼓声即醒狮的「心跳」'],
    funFact: '醒狮高桩表演要在一排高低不一的梅花桩上腾跃翻飞，狮头狮尾两人配合无间，往往要苦练数年。',
  },
  {
    title: '工夫茶', subtitle: '潮汕茶道，品味人生', quizId: 4, icon: 'cafe', color: '#A52A2A', sort: 3,
    image: 'study/gongfucha.jpg', gallery: ['study/gongfucha_1.jpg'],
    intro: '工夫茶流行于潮汕一带，以凤凰单丛等乌龙茶为主，讲究茶具、水温与冲泡章法，关公巡城、韩信点兵皆有门道。一壶三杯、先敬长者，既是日常饮品，更是待客之礼与生活美学。',
    history: '潮州工夫茶是流行于潮汕地区的传统饮茶习俗，可上溯宋代斗茶遗风，明清成形。以凤凰单丛等乌龙茶为主，讲究器、水、火、冲泡与品啜的「工夫」，2008 年列入国家级非遗。',
    highlights: ['茶器小巧：孟臣罐配若深杯，一壶三杯', '冲泡讲究「高冲低斟、关公巡城、韩信点兵」', '一席三杯，先尊后卑、先老后少，重在礼数', '凤凰单丛香型繁多，蜜兰香、鸭屎香各具风韵'],
    funFact: '工夫茶斟茶讲究「关公巡城、韩信点兵」——来回巡斟、最后点滴分尽，为的是每杯浓淡如一。',
  },
  {
    title: '龙舟', subtitle: '百舸争流，奋勇争先', quizId: 5, icon: 'boat', color: '#C0392B', sort: 4,
    image: 'study/longzhou.jpg', gallery: ['study/longzhou_1.jpg', 'study/longzhou_2.jpg'],
    intro: '扒龙舟是端午节的重要习俗，在珠江三角洲尤为兴盛。龙舟修长、龙头高昂，桡手随鼓点齐桨并进，百舸争流、鼓声震天，既竞速亦竞神，凝聚着乡里同心、奋勇争先的精神。',
    history: '扒龙舟是端午节的核心习俗，珠三角水乡尤盛，相传为纪念屈原，亦含祈福禳灾之意。广府「扒龙船」与探亲会景的「龙舟景」自成一格，番禺、东莞、佛山叠滘等地竞渡远近闻名。',
    highlights: ['龙舟修长，龙头高昂、龙尾上翘，彩旗招展', '鼓手立于船头击鼓定速，桡手随鼓齐桨', '叠滘「弯道竞速」需在窄涌急弯中飞驰，惊险刺激', '「龙舟景」走亲访友，重在联谊而非夺标'],
    funFact: '佛山叠滘的龙舟要在仅数米宽的水道里高速过急弯，被称为龙舟界的「飘移」，看点十足。',
  },
  {
    title: '岭南建筑', subtitle: '镬耳山墙，骑楼连廊', quizId: 1, icon: 'home', color: '#9E1B32', sort: 5,
    image: 'study/lnjz.jpg', gallery: ['study/lnjz_1.jpg', 'study/lnjz_2.jpg'],
    intro: '岭南建筑因地制宜、兼容中西，镬耳山墙、骑楼连廊、满洲窗、灰塑砖雕各具特色。通透轻盈、防潮遮阳，适应岭南湿热多雨的气候，于广府、潮汕、客家三大民系中各显风貌。',
    history: '岭南建筑是适应南方湿热多雨、融汇中原与海外风格的地域建筑体系。明清的镬耳屋、近代的骑楼与西关大屋、侨乡的碉楼皆为代表，通透、遮阳、防潮是其不变内核。',
    highlights: ['镬耳山墙形似镬耳，既防火又寓意「独占鳌头」', '骑楼连廊遮阳挡雨、方便商旅，是岭南街景标志', '满洲窗以彩色玻璃拼花，光影斑斓', '西关大屋的趟栊门，通风又安全'],
    funFact: '镬耳屋两端高耸的山墙形似炒菜的「镬（锅）耳」，民间也觉得像官帽，取「独占鳌头」的好意头。',
  },
  {
    title: '广东剪纸', subtitle: '纸上生花，非遗技艺', quizId: 1, icon: 'cut', color: '#C8102E', sort: 6,
    image: 'fyxx/jianzhifm1.jpg', gallery: ['fyxx/jianzhi1.jpg', 'fyxx/jianzhi2.jpg', 'fyxx/jianzhi3.jpg'],
    intro: '广东剪纸以佛山剪纸为代表，独创铜凿料与金箔衬色相结合的工艺，金碧辉煌、玲珑剔透。题材多取吉祥纹样与岭南风物，广泛用于节庆、婚嫁与祭祀装饰，喜气盈门。',
    history: '广东剪纸以佛山剪纸最具特色，宋代已有、明清鼎盛。佛山独创以铜凿、刀刻结合金箔与衬色的「铜凿金花」工艺，金碧辉煌，曾远销海内外，2006 年随中国剪纸列入国家级非遗。',
    highlights: ['铜凿金花：在金箔上凿出密密细点，富丽夺目', '刀刻、衬色、写料相结合，层次丰富', '题材多吉祥纹样：龙凤、花果、戏曲人物', '广用于门笺、礼品、神楼与节庆装饰'],
    funFact: '佛山剪纸的「铜凿」既非剪也非刻，而是用小凿子在金箔上凿出成千上万的细密珠点，远看金光闪烁。',
  },
  {
    title: '皮影戏', subtitle: '光影故事，千年传承', quizId: 1, icon: 'film', color: '#8E3B2F', sort: 7,
    image: 'fyxx/piyingfm.png', gallery: ['fyxx/pyxzs.jpg', 'fyxx/pyxzs1.jpg', 'fyxx/pyxzs2.jpg'],
    intro: '皮影戏以兽皮或纸板雕刻人物，借灯光将剪影投于幕布，艺人一边操纵一边唱念，一口道尽千古事，双手对舞百万兵。岭南陆丰皮影历史悠久，造型精巧、唱腔独特。',
    history: '皮影戏借灯光将兽皮或纸板雕成的影人投于幕布，配以唱念与乐器演绎故事。广东陆丰皮影是南路皮影代表，造型精巧、设色浓艳，与北方皮影风格迥异，2006 年列入国家级非遗。',
    highlights: ['影人以牛皮镂刻、彩绘、缀以关节，可灵活操纵', '一边操纵、一边唱念，「一口道尽千古事」', '陆丰皮影南国风味浓，戏文多取民间传说', '灯影、唱腔、乐器三者合一，恍如纸上电影'],
    funFact: '老艺人形容皮影「一口道尽千古事，双手对舞百万兵」——一人多角、双手操控，台前却如千军万马。',
  },
];
const studyTopics = studyTopicSeed.map((t) => ({
  category: 'topic',
  title: t.title,
  subtitle: t.subtitle,
  content: JSON.stringify({
    quizId: t.quizId,
    image: t.image,
    gallery: t.gallery,
    intro: t.intro,
    history: t.history,
    highlights: t.highlights,
    funFact: t.funFact,
  }),
  icon: t.icon,
  color: t.color,
  sort: t.sort,
}));

// 文化内容：VR全景场景
const vrScenes = [
  { category: 'vr_scene', title: '神农架原始森林 360°', subtitle: '华中绿肺 · 生物多样性宝库', content: '{"lat":31.4650,"lng":110.4987}', icon: 'leaf', color: '#2D6A4F', sort: 0 },
  { category: 'vr_scene', title: '西溪湿地全景', subtitle: '城市之肾 · 湿地生态保育', content: '{"lat":30.2718,"lng":120.0658}', icon: 'water', color: '#40916C', sort: 1 },
  { category: 'vr_scene', title: '光伏电站', subtitle: '清洁能源 · 沙漠变绿洲', content: '{"lat":40.0465,"lng":94.8029}', icon: 'sunny', color: '#E8A838', sort: 2 },
  { category: 'vr_scene', title: '张家界国家森林公园', subtitle: '奇峰三千 · 苍翠欲滴', content: '{"lat":29.3527,"lng":110.4555}', icon: 'mountain', color: '#1B4332', sort: 3 },
  { category: 'vr_scene', title: '九寨沟', subtitle: '人间仙境 · 青山碧水', content: '{"lat":33.2614,"lng":103.9199}', icon: 'images', color: '#52B788', sort: 4 },
  { category: 'vr_scene', title: '海上风电场', subtitle: '绿色能源 · 零碳未来', content: '{"lat":21.5650,"lng":111.8320}', icon: 'flash', color: '#74C69D', sort: 5 },
];

const allCultural = [...cantonesePhrases, ...cantoneseLessons, ...studyTopics, ...vrScenes];

// 评价种子数据 — 与 destination 产品关联
const reviewDefs = [
  { itemType: 'destination', itemIdx: 0, rating: 5, text: '做工非常精致，很有岭南韵味，送礼体面！', authorIdx: 0 },
  { itemType: 'destination', itemIdx: 0, rating: 5, text: '木雕细节处理得很好，朋友收到都很喜欢。', authorIdx: 1 },
  { itemType: 'destination', itemIdx: 6, rating: 5, text: '脸谱画得特别传神，竹扇手感也好，推荐！', authorIdx: 2 },
  { itemType: 'destination', itemIdx: 12, rating: 5, text: '紫砂壶出水很利落，泡单丛茶特别香。', authorIdx: 3 },
  { itemType: 'destination', itemIdx: 16, rating: 4, text: '年画颜色鲜艳，贴在门上很有年味。', authorIdx: 4 },
  { itemType: 'destination', itemIdx: 23, rating: 5, text: '醒狮头盔做工很扎实，给孩子买了当礼物。', authorIdx: 5 },
  { itemType: 'destination', itemIdx: 31, rating: 5, text: '凤凰单丛茶香气独特，耐泡，物超所值。', authorIdx: 6 },
  { itemType: 'destination', itemIdx: 33, rating: 4, text: '陈皮味道很正，煲汤放一片就够味。', authorIdx: 7 },
  { itemType: 'destination', itemIdx: 7, rating: 5, text: '光盘套装很全面，在家也能欣赏粤曲。', authorIdx: 0 },
  { itemType: 'destination', itemIdx: 13, rating: 5, text: '摆件很精美，放在办公室很有岭南气息。', authorIdx: 1 },
];

async function main() {
  // 幂等：清空后重插，便于反复跑
  await prisma.destination.deleteMany();
  await prisma.destination.createMany({ data: destinations });
  await prisma.culturalContent.deleteMany();
  await prisma.culturalContent.createMany({ data: allCultural });
  await prisma.banner.deleteMany();
  await prisma.banner.createMany({ data: banners });
  await prisma.scenic.deleteMany();
  await prisma.scenic.createMany({
    data: scenics.map((s) => ({ ...s, price: scenicPrice(s.city) })),
  });
  await prisma.quiz.deleteMany();
  await prisma.quiz.createMany({ data: quizzes });
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.favorite.deleteMany();
  const community = await seedCommunity();

  // 为社区作者生成交易流水
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const txTemplates = [
    { type: 'in', title: '每日签到', amount: '+10' },
    { type: 'out', title: '购买文创产品', amount: '-128.00' },
    { type: 'in', title: '答题奖励', amount: '+10' },
    { type: 'in', title: '签到奖励', amount: '+10' },
    { type: 'out', title: '优惠券兑换', amount: '-50' },
    { type: 'in', title: '注册礼包', amount: '+200' },
    { type: 'out', title: '购买景点门票', amount: '-88.00' },
    { type: 'in', title: '积分兑换余额', amount: '+20' },
  ];
  const txData: { type: string; title: string; amount: string; userId: string; createdAt: Date }[] = [];
  allUsers.forEach((u) => {
    txTemplates.forEach((t, i) => {
      txData.push({ ...t, userId: u.id, createdAt: new Date(Date.now() - i * 36_000_000) });
    });
  });
  await prisma.transaction.createMany({ data: txData });

  // 为社区作者生成收藏
  const favoriteDefs = [
    { itemType: 'scenic', itemId: 1, title: '广州塔', date: '2026-06-15', location: '广州', tag: '景点' },
    { itemType: 'scenic', itemId: 2, title: '丹霞山', date: '2026-06-20', location: '韶关', tag: '景点' },
    { itemType: 'destination', itemId: 7, title: '粤剧脸谱竹扇', date: '', location: '', tag: '文创' },
    { itemType: 'destination', itemId: 22, title: '广州醒狮工艺头盔', date: '', location: '', tag: '文创' },
  ];
  for (const fd of favoriteDefs) {
    for (let i = 0; i < Math.min(3, allUsers.length); i++) {
      try {
        await prisma.favorite.create({
          data: { userId: allUsers[i].id, itemType: fd.itemType, itemId: fd.itemId, title: fd.title, date: fd.date, location: fd.location, tag: fd.tag },
        });
      } catch { /* 可能重复跳过 */ }
    }
  }

  // 为产品创建评价
  const destRows = await prisma.destination.findMany({ orderBy: { id: 'asc' } });
  for (const rd of reviewDefs) {
    if (rd.itemIdx < destRows.length) {
      const d = destRows[rd.itemIdx];
      const author = allUsers[rd.authorIdx % allUsers.length];
      try {
        await prisma.review.create({
          data: { itemType: rd.itemType, itemId: d.id, rating: rd.rating, text: rd.text, authorId: author.id },
        });
      } catch { /* skip */ }
    }
  }

  console.log(
    `已 seed：文创 ${destinations.length} / 轮播 ${banners.length} / 景点 ${scenics.length} / 课堂 ${quizzes.length} / 文化 ${allCultural.length} / 社区作者 ${community.authors} / 动态 ${community.stories} / 流水 ${txData.length} / 评价 ${reviewDefs.length}`,
  );
}

main()
  .catch((e) => {
    console.error('seed 失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
