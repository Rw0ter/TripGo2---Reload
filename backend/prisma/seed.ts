import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

// 社区动态——非遗文化传承主题。images 为前端本地资源 key；authorIdx 指向 communityAuthors。
const storyDefs = [
  {
    authorIdx: 0,
    title: '粤剧后台探班：一勾脸，半世纪功夫',
    content:
      '红船弟子的油彩一层层叠上去，凤冠珠串轻轻一晃就是百年。老倌说唱念做打里最难的是「做」——一个水袖甩出去，台下要看得懂悲喜。这门戏，值得被更多年轻人接住。',
    images: ['xc/xc_guangzhou.jpg'],
  },
  {
    authorIdx: 1,
    title: '跟广绣阿姨学了一下午，才绣完半片木棉',
    content:
      '广绣的针脚细到要眯着眼找，一根丝线劈成十六分之一才够细。阿姨绣了四十年，木棉花在她手里像会呼吸。她说手艺不怕慢，怕没人学。',
    images: ['jd/gzcl.png'],
  },
  {
    authorIdx: 3,
    title: '醒狮采青，鼓点一响整条街都醒了',
    content:
      '狮头一抬一探，眼睛会眨、耳朵会动，全靠舞狮人腰马的功夫。最震撼是采青那一跳，桩与桩之间一丈来宽，落点稳得像生了根。岭南人过节的精气神都在这鼓点里。',
    images: ['changlong.png'],
  },
  {
    authorIdx: 2,
    title: '潮州工夫茶：三杯之间，皆是规矩',
    content:
      '关公巡城、韩信点兵，斟茶的手法一点不能马虎。老伯说工夫茶喝的不是茶，是待客的心意。一壶单丛冲到第七道还有余香，时间都泡在杯里了。',
    images: ['xc/xc_chaozhou.jpeg'],
  },
  {
    authorIdx: 5,
    title: '龙舟下水前，先给龙头簪花挂红',
    content:
      '端午前的祠堂，老人给龙头点睛、簪花、挂上红绸。一村人扛着龙舟往河里走，号子一喊，几十支桨同时入水。这条河，他们划了几百年。',
    images: ['xc/xc_dongguan.jpg'],
  },
  {
    authorIdx: 4,
    title: '香云纱晒莨：阳光和河泥染出的「软黄金」',
    content:
      '一匹香云纱要过三十几道工序，薯莨汁浸、河泥涂、草地上晾晒，全看天吃饭。师傅说这布越穿越亮，是大自然亲手染的，摸上去像凉玉。',
    images: ['xc/xc_huizhou.jpg'],
  },
  {
    authorIdx: 6,
    title: '广彩瓷：在白瓷上画一座岭南城',
    content:
      '描金的笔尖比头发还细，金线绕着花鸟一圈圈铺开，行内叫「织金彩瓷」。画师说一只杯子要烧三次、画十几天，急不得。出窑那一刻整间作坊都亮了。',
    images: ['dgypzzbwg.png'],
  },
  {
    authorIdx: 2,
    title: '英歌舞：揭阳少年的脸谱与槌声',
    content:
      '一百零八条好汉的脸谱画在年轻人脸上，木槌相击，地动山摇。领舞的少年才十六岁，他说爷爷跳过、爸爸跳过，现在轮到他。这股劲，叫传承。',
    images: ['xc/xc_jieyang.jpeg'],
  },
];

// 评论文案池——贴合非遗传承主题。
const commentTexts = [
  '这门手艺真该好好传下去',
  '看得人起鸡皮疙瘩，太震撼了',
  '请问这个工坊可以预约体验吗？',
  '岭南的非遗越了解越着迷',
  '为坚守的手艺人点赞',
  '已收藏，下次带孩子一起去看',
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

// 文化内容：非遗学习主题
const studyTopics = [
  { category: 'topic', title: '粤剧', subtitle: '岭南文化瑰宝，世界级非遗', content: '{"quizId":1}', icon: 'musical-notes', color: '#E05C3A', sort: 0 },
  { category: 'topic', title: '广绣', subtitle: '一针一线绣出岭南风华', content: '{"quizId":2}', icon: 'color-palette', color: '#D44A7A', sort: 1 },
  { category: 'topic', title: '醒狮', subtitle: '威武雄壮，驱邪纳福', content: '{"quizId":3}', icon: 'paw', color: '#E0892F', sort: 2 },
  { category: 'topic', title: '工夫茶', subtitle: '潮汕茶道，品味人生', content: '{"quizId":4}', icon: 'cafe', color: '#5C8A6D', sort: 3 },
  { category: 'topic', title: '龙舟', subtitle: '百舸争流，奋勇争先', content: '{"quizId":5}', icon: 'boat', color: '#3B7CB6', sort: 4 },
  { category: 'topic', title: '岭南建筑', subtitle: '镬耳山墙，骑楼连廊', content: '{}', icon: 'home', color: '#7B68AE', sort: 5 },
  { category: 'topic', title: '广东剪纸', subtitle: '纸上生花，非遗技艺', content: '{}', icon: 'cut', color: '#C0392B', sort: 6 },
  { category: 'topic', title: '皮影戏', subtitle: '光影故事，千年传承', content: '{}', icon: 'film', color: '#8E6B3F', sort: 7 },
];

// 文化内容：VR全景场景
const vrScenes = [
  { category: 'vr_scene', title: '广州塔 360°', subtitle: '珠江新城天际线', content: '{"lat":23.1065,"lng":113.3245}', icon: 'eye', color: '#E05C3A', sort: 0 },
  { category: 'vr_scene', title: '丹霞山全景', subtitle: '世界自然遗产', content: '{"lat":25.0132,"lng":113.7387}', icon: 'mountain', color: '#5C8A6D', sort: 1 },
  { category: 'vr_scene', title: '开平碉楼', subtitle: '世界文化遗产', content: '{"lat":22.2865,"lng":112.6991}', icon: 'home', color: '#8E6B3F', sort: 2 },
  { category: 'vr_scene', title: '珠江夜景', subtitle: '两岸璀璨灯火', content: '{"lat":23.1134,"lng":113.2594}', icon: 'moon', color: '#3B7CB6', sort: 3 },
  { category: 'vr_scene', title: '粤剧艺术博物馆', subtitle: '岭南园林中的非遗', content: '{"lat":23.1228,"lng":113.2485}', icon: 'business', color: '#7B68AE', sort: 4 },
  { category: 'vr_scene', title: '潮州古城', subtitle: '千年古韵广济桥', content: '{"lat":23.6665,"lng":116.6437}', icon: 'flag', color: '#C0392B', sort: 5 },
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
