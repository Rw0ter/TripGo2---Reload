import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type Mode = 'planner' | 'chat';

interface MsgItem {
  role: 'user' | 'assistant';
  text: string;
}

interface PlanResult {
  route: string;
  days: string;
  budget: string;
  markdown: string;
}

const CHAT_SUGGESTIONS = [
  '推荐一个广州三日游行程',
  '岭南非遗文化有哪些？',
  '潮汕美食推荐',
  '广东省博物馆开放时间',
  '开平碉楼有什么历史？',
  '佛山醒狮表演在哪里看？',
];

const PREFERENCE_TAGS = [
  '自然风光',
  '历史文化',
  '美食之旅',
  '非遗体验',
  '亲子游玩',
  '摄影打卡',
];

const GD_CITIES = [
  '广州', '深圳', '珠海', '佛山', '东莞', '中山',
  '惠州', '江门', '肇庆', '汕头', '潮州', '揭阳',
  '汕尾', '湛江', '茂名', '阳江', '韶关', '梅州',
  '河源', '清远', '云浮',
];

// ---------------------------------------------------------------------------
// Fallback AI — keyword-aware response generator
// ---------------------------------------------------------------------------

interface KeywordRule {
  keywords: string[];
  reply: (q: string) => string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['非遗', '非物质文化遗产', '粤剧', '广绣', '醒狮', '工夫茶', '灰塑', '龙舟', '剪纸', '陶塑', '英歌舞'],
    reply: () =>
      '岭南地区非物质文化遗产丰富，以下是一些代表性项目：\n\n' +
      '**粤剧** — 联合国人类非物质文化遗产，又称"广东大戏"，流行于粤港澳及海外粤语华人社区。\n\n' +
      '**醒狮** — 广东地区的传统民间舞狮，又称"南狮"，以佛山醒狮最为著名，鼓点激昂，动作刚劲。\n\n' +
      '**广绣** — 与苏绣、湘绣、蜀绣并称中国四大名绣，以色彩饱满、构图繁而不乱著称。\n\n' +
      '**工夫茶** — 潮汕地区的茶文化，讲究"和、敬、精、乐"的精神，以凤凰单丛茶为佳品。\n\n' +
      '**佛山陶塑** — 石湾陶塑已有千年历史，以人物造型见长，"石湾公仔"闻名遐迩。\n\n' +
      '推荐非遗体验地：广州粤剧艺术博物馆、佛山祖庙、潮州古城、石湾南风古灶。',
  },
  {
    keywords: ['美食', '吃', '推荐', '特色', '小吃', '早茶', '潮汕', '顺德', '客家', '肠粉', '点心', '烧鹅', '白切鸡'],
    reply: (q: string) => {
      if (/潮汕|汕头|潮州|揭阳/.test(q)) {
        return (
          '**潮汕美食推荐**\n\n' +
          '潮汕菜以精细、清淡、鲜美著称：\n\n' +
          '- 潮汕牛肉火锅：手打牛肉丸弹牙爽口，现切鲜牛肉涮8秒即食\n' +
          '- 潮汕卤鹅：选用狮头鹅，卤汁醇厚，鹅肉嫩滑\n' +
          '- 蚝烙：生蚝与番薯粉煎制，外酥内嫩\n' +
          '- 粿条汤：猪骨熬汤，配上各式潮汕粿品\n' +
          '- 工夫茶配茶点：腐乳饼、朥饼、豆条\n\n' +
          '推荐探店地：汕头小公园美食街、潮州牌坊街、揭阳榕城老城区。'
        );
      }
      if (/顺德|佛山.*食/.test(q)) {
        return (
          '**顺德美食推荐**\n\n' +
          '顺德是联合国教科文组织认证的"世界美食之都"：\n\n' +
          '- 顺德鱼生：薄如蝉翼，冰镇爽口\n' +
          '- 双皮奶：大良金榜街正宗，奶香浓郁\n' +
          '- 均安蒸猪：整猪蒸制，酥烂入味\n' +
          '- 伦教糕：米香和清甜完美平衡\n' +
          '- 大良炒牛奶：牛奶与蛋清、虾仁混炒，嫩滑鲜香\n\n' +
          '推荐寻味路线：大良华盖路 → 清晖园 → 容桂渔人码头。'
        );
      }
      return (
        '**广东美食之旅指南**\n\n' +
        '广东作为美食天堂，三大菜系各具特色：\n\n' +
        '**广府菜** — 清淡鲜美，讲究原味\n' +
        '- 早茶（虾饺、烧卖、叉烧包、凤爪、肠粉）\n' +
        '- 白切鸡、烧鹅、老火靓汤\n' +
        '- 推荐城市：广州、佛山、顺德\n\n' +
        '**潮汕菜** — 精致细腻，擅长海鲜\n' +
        '- 牛肉火锅、卤鹅、蚝烙、鱼饭\n' +
        '- 推荐城市：汕头、潮州\n\n' +
        '**客家菜** — 咸香浓郁，回味悠长\n' +
        '- 盐焗鸡、梅菜扣肉、酿豆腐\n' +
        '- 推荐城市：梅州、河源\n\n' +
        '美食街区推荐：广州上下九 / 西华路、顺德大良、惠州西湖美食街。'
      );
    },
  },
  {
    keywords: ['碉楼', '开平', '华侨', '世界遗产'],
    reply: () =>
      '**开平碉楼与村落**\n\n' +
      '2007年列入联合国世界文化遗产名录，是广东首个世界文化遗产。\n\n' +
      '开平碉楼起源于明末清初，现存约1833座，集防卫、居住和中西建筑艺术于一体，融合了中国传统乡村建筑与西方建筑风格。\n\n' +
      '**推荐参观**：\n' +
      '- 自力村碉楼群（最集中，15座碉楼）\n' +
      '- 马降龙碉楼群（世界最美村落之一）\n' +
      '- 锦江里瑞石楼（开平第一楼）\n' +
      '- 立园（华侨私家园林）\n\n' +
      '**交通**：广州出发约2小时，建议自驾或高铁到开平南站换乘公交。\n' +
      '**最佳季节**：春秋两季（3-5月、9-11月），稻田环绕时拍照最美。',
  },
  {
    keywords: ['博物馆', '开放时间', '展览'],
    reply: () =>
      '**广东省主要博物馆信息**\n\n' +
      '**广东省博物馆**（广州珠江新城）\n' +
      '- 周二至周日 9:00-17:00（16:00停止入馆）\n' +
      '- 周一闭馆（法定节假日除外）\n' +
      '- 免费，需提前在公众号"广东省博物馆"预约\n\n' +
      '**广州粤剧艺术博物馆**（荔湾恩宁路）\n' +
      '- 周二至周日 9:00-17:00\n' +
      '- 免费，需预约\n\n' +
      '**佛山祖庙博物馆**（佛山禅城）\n' +
      '- 每日 8:30-17:30\n' +
      '- 门票20元\n\n' +
      '**深圳博物馆**（福田区）\n' +
      '- 周二至周日 10:00-18:00\n' +
      '- 免费，无需预约\n\n' +
      '**潮州市博物馆**\n' +
      '- 周二至周日 9:00-17:00\n' +
      '- 免费\n\n' +
      '温馨提示：各馆开放时间可能临时调整，建议出行前查看官方公众号确认。',
  },
  {
    keywords: [
      '行程', '路线', '几天', '一日', '两日', '三日', '四日', '五日',
      '旅游计划', '打卡', '攻略', '怎么去', '怎么玩',
    ],
    reply: (q: string) => {
      const cityMatch = GD_CITIES.find((c) => q.includes(c)) || '广州';
      const dayMatch = q.match(/(\d+)\s*[日天]/);
      const days = dayMatch ? Number(dayMatch[1]) : 2;
      return generateCityItinerary(cityMatch, days);
    },
  },
  {
    keywords: ['广东', '岭南文化', '岭南', '文化'],
    reply: () =>
      '**岭南文化概述**\n\n' +
      '岭南文化是中华文化的重要分支，以广府文化、潮汕文化、客家文化三大民系文化为核心，涵盖建筑、饮食、戏曲、工艺、民俗等多个领域。\n\n' +
      '**三大民系**：\n' +
      '- **广府文化**：以广州为中心，粤剧、广绣、广彩、灰塑为代表，商业文化气息浓厚\n' +
      '- **潮汕文化**：工夫茶、潮剧、潮绣、木雕，注重精细和礼俗\n' +
      '- **客家文化**：围龙屋、客家山歌、客家娘酒，以勤劳坚韧著称\n\n' +
      '此外，广东还有瑶族、畲族等少数民族文化，以及海上丝绸之路带来的多元外来文化影响。\n\n' +
      '推荐文化探索路线：广州（粤剧博物馆、沙面）→ 佛山（祖庙、南风古灶）→ 潮州（古城、广济桥）→ 梅州（客天下、围龙屋）。',
  },
  {
    keywords: ['广州塔', '广州', '花城', '羊城', '珠江'],
    reply: () =>
      '**广州 —— 千年商都，花城广州**\n\n' +
      '广州是广东省省会，别称"羊城""花城"，拥有2200多年建城史。\n\n' +
      '**必打卡景点**：\n' +
      '- 广州塔（小蛮腰）：600米高，可俯瞰珠江新城全景\n' +
      '- 珠江夜游：晚上乘船看两岸灯光秀，最佳时间19:30-21:00\n' +
      '- 越秀公园：五羊石像（广州标志），镇海楼\n' +
      '- 陈家祠：岭南建筑艺术的集大成者（广东民间工艺博物馆）\n' +
      '- 沙面岛：19世纪欧陆风情建筑群，拍照圣地\n' +
      '- 永庆坊：西关老城活化改造，体验地道广府生活\n' +
      '- 白云山："羊城第一秀"，适合半日登山\n\n' +
      '**特色体验**：早茶（点都德 / 陶陶居 / 泮溪酒家）、西关骑楼漫步、荔枝湾涌游船。\n\n' +
      '**周边推荐**：佛山（20分钟高铁）、顺德（美食）、从化（温泉）。',
  },
];

// Compose chat fallback response by matching keywords
function generateChatReply(query: string): string {
  const lower = query.toLowerCase();
  // Score each rule by how many keywords match
  let best: KeywordRule | null = null;
  let bestScore = 0;
  for (const rule of KEYWORD_RULES) {
    const score = rule.keywords.reduce((s, kw) => s + (lower.includes(kw.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  if (best && bestScore > 0) return best.reply(query);

  // Generic fallback
  return (
    `很高兴收到你的问题！虽然我目前的知识库还在完善中，但我可以帮你：\n\n` +
    `- **规划行程**：切换到"行程规划"模式，输入出发地和目的地即可生成完整行程\n` +
    `- **了解岭南文化**：问我有关粤剧、醒狮、广绣、工夫茶等非遗项目的问题\n` +
    `- **美食推荐**：了解广东各地特色美食和探店指南\n` +
    `- **旅游攻略**：获取广州、潮汕、佛山等热门目的地的游玩建议\n\n` +
    `也可以试试问我："推荐一个广州三日游行程"、"岭南非遗文化有哪些？"、"潮汕美食推荐"。`
  );
}

// Generate a structured itinerary for a given city
function generateCityItinerary(city: string, days: number): string {
  const spots: Record<string, string[]> = {
    '广州': [
      '越秀公园（五羊石像） + 南越王博物院', '陈家祠 + 永庆坊 + 沙面岛', '广州塔 + 珠江夜游',
      '白云山', '广东省博物馆 + 花城广场', '荔枝湾涌 + 上下九步行街',
      '黄埔军校旧址 + 辛亥革命纪念馆',
    ],
    '深圳': [
      '世界之窗 + 锦绣中华', '深圳湾公园 + 人才公园', '大梅沙海滨公园',
      '华侨城创意园', '莲花山公园 + 市民中心', '蛇口海上世界',
    ],
    '佛山': [
      '祖庙 + 醒狮表演', '南风古灶（陶艺体验）', '岭南天地', '西樵山',
      '顺德清晖园 + 大良美食街', '三水荷花世界',
    ],
    '珠海': [
      '长隆海洋王国', '情侣路 + 珠海渔女', '外伶仃岛', '圆明新园',
      '港珠澳大桥观光', '横琴花海长廊',
    ],
    '潮州': [
      '潮州古城 + 牌坊街', '广济桥（湘子桥）', '开元寺', '韩文公祠',
      '工夫茶体验', '凤凰山（凤凰单丛茶园）',
    ],
    '汕头': [
      '小公园历史文化街区', '南澳岛', '礐石风景区', '汕头老市区骑楼',
      '陈慈黉故居', '东海岸新城',
    ],
    '韶关': ['丹霞山', '南华寺', '云门山', '珠玑古巷', '梅关古道'],
    '梅州': ['客天下', '雁南飞茶田', '围龙屋', '叶剑英纪念园', '灵光寺'],
    '惠州': ['惠州西湖', '罗浮山', '双月湾', '巽寮湾', '南昆山'],
    '江门': ['开平碉楼', '赤坎古镇', '小鸟天堂', '圭峰山', '上下川岛'],
    '肇庆': ['七星岩', '鼎湖山', '端州古城', '羚羊峡古栈道'],
    '中山': ['孙中山故居', '詹园', '岐江公园', '兴中广场'],
    '清远': ['古龙峡', '连州地下河', '英西峰林', '北部万科城温泉'],
  };

  const citySpots = spots[city] || [
    '市中心文化地标', '当地著名公园', '特色老街 + 美食', '周边自然风光',
    '博物馆 / 纪念馆', '夜市 / 文创街区', '特色体验项目',
  ];

  let result = `**${city} ${days}日游行程推荐**\n\n`;
  result += `> ${city}是一座充满魅力的城市，${days}天时间可以较好地体验当地精华。以下是根据文旅/研学场景设计的行程建议：\n\n`;

  const timeSlots = [
    ['09:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-21:00'],
    ['08:30-12:00', '12:00-14:00', '14:00-17:30', '18:00-21:00'],
    ['09:00-12:00', '12:00-13:30', '14:00-17:00', '18:00-20:30'],
  ];

  for (let d = 0; d < Math.min(days, 7); d++) {
    const slotSet = timeSlots[Math.min(d, timeSlots.length - 1)];
    const spotIdx = d * 2;
    const spotA = citySpots[spotIdx % citySpots.length];
    const spotB = citySpots[(spotIdx + 1) % citySpots.length];

    result += `### 第${d + 1}天\n`;
    result += `- **上午（${slotSet[0]}）**：前往 **${spotA}**，深度游览约2-3小时\n`;
    result += `- **午餐（${slotSet[1]}）**：品尝当地特色美食，可在景点周边口碑餐馆用餐\n`;
    result += `- **下午（${slotSet[2]}）**：前往 **${spotB}**，拍照打卡，体验在地文化\n`;
    result += `- **晚上（${slotSet[3]}）**：逛夜市或品尝地道晚餐，感受城市夜景\n\n`;
  }

  result += `### 行前贴士\n`;
  result += `- 建议提前预订热门景点门票，避开节假日高峰\n`;
  result += `- 出行前查看当地天气，备好雨具或防晒用品\n`;
  result += `- 公交地铁出行方便，建议下载当地交通APP\n`;
  result += `- 品尝街头小吃注意卫生，选择人气旺的店铺\n`;
  result += `- 研学行程可提前联系当地文旅部门了解活动信息\n`;

  return result;
}

// Generate trip plan fallback when no backend AI is available
function generateTripPlan(
  origin: string,
  destination: string,
  budget: number,
  days: number,
  tags: string[],
  extra: string,
): string {
  const tagText = tags.length > 0 ? tags.join('、') : '综合体验';
  let plan = `**${origin} → ${destination} · ${days}天行程 · 人均约¥${budget}**\n\n`;
  plan += `> 偏好：${tagText} | ${extra || '无特殊备注'}\n\n`;
  plan += `## 行程概览\n\n`;
  plan += `这是一趟从${origin}出发、以${destination}为核心的${days}天文旅研学之旅。`;
  plan += `整体节奏松紧有度，兼顾${tagText}的需求，适合爱探索、爱文化的旅行者。`;
  plan += `人均预算控制在¥${budget}以内，合理安排交通、住宿、餐饮和门票。\n\n`;

  const hr = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-21:00'];
  for (let d = 0; d < Math.min(days, 7); d++) {
    const emoji = ['🏛️', '🌿', '🍜', '🎭', '📸', '⛰️', '🏙️'][d % 7];
    const themes = ['初识', '深度探索', '文化沉浸', '自然漫游', '味蕾之旅', '慢时光', '精华收官'];

    plan += `### ${emoji} 第${d + 1}天 · ${themes[d]}\n\n`;
    plan += `- **上午（${hr[0]}）**：抵达${d === 0 ? `目的地核心区，安顿行李，初步感受${destination}的城市气质` : '继续探索新的景点，深度体验在地文化'}\n`;
    if (tags.includes('美食之旅')) {
      plan += `- **午餐（${hr[1]}）**：寻访当地人气餐馆，品尝${destination}特色风味\n`;
    } else {
      plan += `- **午餐（${hr[1]}）**：简便用餐，稍作休整\n`;
    }
    if (tags.includes('非遗体验')) {
      plan += `- **下午（${hr[2]}）**：参加非遗手作体验，了解传统工艺背后的故事\n`;
    } else if (tags.includes('摄影打卡')) {
      plan += `- **下午（${hr[2]}）**：前往最佳拍照点位，记录${destination}最美一面\n`;
    } else {
      plan += `- **下午（${hr[2]}）**：探访当地代表性景点，深入了解${destination}的历史文化\n`;
    }
    plan += `- **晚上（${hr[3]}）**：${d < days - 1 ? '漫步夜市或江边，感受当地夜生活氛围' : '享用告别晚餐，整理行装与旅途记忆'}\n\n`;
  }

  plan += `## 预算参考\n\n`;
  plan += `| 项目 | 预估费用（人均） |\n`;
  plan += `|------|----------|\n`;
  const transport = Math.round(budget * 0.2);
  const accommodation = Math.round(budget * 0.35);
  const food = Math.round(budget * 0.25);
  const tickets = Math.round(budget * 0.15);
  const other = budget - transport - accommodation - food - tickets;
  plan += `| 交通（往返+市内） | ¥${transport} |\n`;
  plan += `| 住宿（${days <= 1 ? '1' : days - 1}晚） | ¥${accommodation} |\n`;
  plan += `| 餐饮 | ¥${food} |\n`;
  plan += `| 门票+体验 | ¥${tickets} |\n`;
  plan += `| 其他（购物/备用） | ¥${other} |\n\n`;

  plan += `## 行前贴士\n\n`;
  plan += `- 提前查看${destination}天气，合理搭配衣物和防晒用品\n`;
  plan += `- 热门景点建议提前1-3天线上预约购票\n`;
  plan += `- 下载离线地图，部分山区信号可能不稳\n`;
  plan += `- 携带适量现金，部分老店和小摊位可能不支持扫码\n`;
  plan += `- 注意饮食卫生，备一些肠胃药以防水土不服\n`;
  plan += `- 研学体验项目建议提前联系确认开放情况\n`;

  return plan;
}

// =========================================================================
// Component
// =========================================================================

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();

  // --- Mode state ---
  const [mode, setMode] = useState<Mode>('planner');

  // --- Chat state ---
  const [msgs, setMsgs] = useState<MsgItem[]>([
    {
      role: 'assistant',
      text: '你好！我是文脉粤游智能助手。\n我可以帮你规划行程、介绍岭南文化、推荐美食景点。试试问我吧！',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // --- Planner state ---
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(2000);
  const [days, setDays] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const planScrollRef = useRef<ScrollView>(null);

  // --- Toggle tag ---
  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  // --- Chat: send message ---
  async function sendChat(q?: string) {
    const text = (q ?? chatInput).trim();
    if (!text || chatLoading) return;
    const userMsg: MsgItem = { role: 'user', text };
    setMsgs((m) => [...m, userMsg]);
    setChatInput('');
    setChatLoading(true);

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    const aiText = generateChatReply(text);
    setMsgs((m) => [...m, { role: 'assistant', text: aiText }]);
    setChatLoading(false);

    // Scroll to bottom after a frame
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // --- Planner: generate trip ---
  async function generateTrip() {
    if (!origin.trim() || !destination.trim()) return;
    setPlanLoading(true);
    setPlanResult(null);

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
    const markdown = generateTripPlan(origin.trim(), destination.trim(), budget, days, selectedTags, notes.trim());
    setPlanResult({
      route: `${origin.trim()} → ${destination.trim()}`,
      days: `${days} 天`,
      budget: `${budget} 元`,
      markdown,
    });
    setPlanLoading(false);

    setTimeout(() => planScrollRef.current?.scrollToEnd({ animated: true }), 200);
  }

  // --- Markdown renderer ---
  function renderMarkdown(text: string) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();
      const key = `md-${i}`;

      if (!trimmed) {
        elements.push(<View key={key} className="h-2" />);
        i++;
        continue;
      }

      // h2
      if (trimmed.startsWith('## ')) {
        elements.push(
          <Text key={key} className="text-[16px] font-bold text-[#1a1a1a] mt-3 mb-1">
            {trimmed.slice(3)}
          </Text>,
        );
        i++;
        continue;
      }
      // h3
      if (trimmed.startsWith('### ')) {
        elements.push(
          <Text key={key} className="text-[15px] font-semibold text-[#333] mt-2 mb-1">
            {trimmed.slice(4)}
          </Text>,
        );
        i++;
        continue;
      }
      // blockquote
      if (trimmed.startsWith('> ')) {
        elements.push(
          <View key={key} className="bg-[#f0f7f2] rounded-lg px-3 py-2 my-1 border-l-4 border-[#386641]">
            <Text className="text-[13px] text-[#555] leading-5">{trimmed.slice(2)}</Text>
          </View>,
        );
        i++;
        continue;
      }
      // table row (|...|)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.split('|').filter((c) => c.trim()).map((c) => c.trim());
        if (cells.length === 2) {
          elements.push(
            <View key={key} className="flex-row justify-between px-2 py-1">
              <Text className="text-[13px] text-[#555]">{cells[0]}</Text>
              <Text className="text-[13px] font-medium text-[#333]">{cells[1]}</Text>
            </View>,
          );
        }
        i++;
        continue;
      }
      // table separator (|---|---|)
      if (/^\|[-| ]+\|$/.test(trimmed)) {
        elements.push(<View key={key} className="h-px bg-[#e5e7eb] mx-2" />);
        i++;
        continue;
      }
      // unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.slice(2);
        elements.push(
          <View key={key} className="flex-row ml-3 mt-0.5">
            <Text className="text-[#386641] mr-1.5">•</Text>
            <Text className="text-[14px] text-[#333] leading-5 flex-1">
              {renderInlineFormats(content)}
            </Text>
          </View>,
        );
        i++;
        continue;
      }
      // paragraph
      elements.push(
        <Text key={key} className="text-[14px] text-[#333] leading-5 mt-0.5">
          {renderInlineFormats(trimmed)}
        </Text>,
      );
      i++;
    }
    return elements;
  }

  function renderInlineFormats(text: string): React.ReactNode {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={idx} className="font-semibold text-[#1a1a1a]">
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={idx}>{part}</Text>;
    });
  }

  // =========================================================================
  // Render
  // =========================================================================

  const bgColor = '#F4F1E4';
  const primary = '#386641';

  return (
    <View className="flex-1" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <View className="bg-[#3E6B4F]">
        <ScreenHeader title="智能助手" tint="dark" />
        {/* Mode toggle */}
        <View className="px-4 pb-3">
          <View className="flex-row bg-white/15 rounded-xl p-1">
            <Pressable
              onPress={() => setMode('planner')}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                mode === 'planner' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Ionicons
                name="compass"
                size={16}
                color={mode === 'planner' ? primary : '#fff'}
              />
              <Text
                className={`ml-1.5 text-[13px] font-medium ${
                  mode === 'planner' ? 'text-[#386641]' : 'text-white'
                }`}
              >
                行程规划
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('chat')}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                mode === 'chat' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={16}
                color={mode === 'chat' ? primary : '#fff'}
              />
              <Text
                className={`ml-1.5 text-[13px] font-medium ${
                  mode === 'chat' ? 'text-[#386641]' : 'text-white'
                }`}
              >
                AI 对话
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ================================================================== */}
      {/* Planner Mode */}
      {/* ================================================================== */}
      {mode === 'planner' && (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={-insets.bottom}
        >
          <ScrollView
            ref={planScrollRef}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero label */}
            <View className="px-4 mt-4 flex-row items-center">
              <View className="bg-[#dcfce7] rounded-full px-2.5 py-1 flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-[#22c55e] mr-1.5" />
                <Text className="text-[12px] text-[#166534]">填好基本信息，自动生成完整行程</Text>
              </View>
            </View>

            {/* Form card */}
            <View className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm border border-[#e5e7eb]">
              {/* Origin + Destination */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-[12px] text-[#6b7280] mb-1">
                    出发地 <Text className="text-[10px] text-[#9ca3af]">From</Text>
                  </Text>
                  <View className="flex-row items-center bg-[#f9fafb] rounded-full border border-[#e5e7eb] px-3 py-2.5">
                    <Ionicons name="location-outline" size={16} color="#9ca3af" />
                    <TextInput
                      value={origin}
                      onChangeText={setOrigin}
                      placeholder="例如：广州"
                      placeholderTextColor="#cbd5e1"
                      className="flex-1 ml-2 text-[14px] text-[#111827]"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] text-[#6b7280] mb-1">
                    目的地 <Text className="text-[10px] text-[#9ca3af]">To</Text>
                  </Text>
                  <View className="flex-row items-center bg-[#f9fafb] rounded-full border border-[#e5e7eb] px-3 py-2.5">
                    <Ionicons name="flag-outline" size={16} color="#9ca3af" />
                    <TextInput
                      value={destination}
                      onChangeText={setDestination}
                      placeholder="例如：潮州"
                      placeholderTextColor="#cbd5e1"
                      className="flex-1 ml-2 text-[14px] text-[#111827]"
                    />
                  </View>
                </View>
              </View>

              {/* Budget slider */}
              <View className="mt-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-3">
                <View className="flex-row justify-between items-baseline">
                  <Text className="text-[12px] text-[#6b7280]">人均预算</Text>
                  <Text className="text-[16px] font-semibold text-[#166534]">
                    ¥{budget}
                    <Text className="text-[12px] text-[#6b7280] font-normal"> / 人</Text>
                  </Text>
                </View>
                <View className="flex-row items-center mt-2">
                  {/* Custom slider track using Pressable */}
                  <View className="flex-1 h-8 justify-center">
                    <View className="h-1.5 rounded-full bg-[#e5e7eb] relative">
                      <View
                        className="h-1.5 rounded-full bg-[#22c55e] absolute left-0 top-0"
                        style={{ width: `${((budget - 500) / 4500) * 100}%` }}
                      />
                    </View>
                    <View
                      className="absolute w-4 h-4 rounded-full bg-white border border-[#9ca3af] shadow-sm"
                      style={{ left: `${((budget - 500) / 4500) * 100}%`, marginLeft: -8 }}
                    />
                  </View>
                  {/* +/- buttons */}
                  <View className="flex-row ml-3 gap-1.5">
                    <Pressable
                      onPress={() => setBudget(Math.max(500, budget - 100))}
                      className="w-8 h-8 rounded-full bg-[#e5e7eb] items-center justify-center"
                    >
                      <Ionicons name="remove" size={16} color="#555" />
                    </Pressable>
                    <Pressable
                      onPress={() => setBudget(Math.min(5000, budget + 100))}
                      className="w-8 h-8 rounded-full bg-[#e5e7eb] items-center justify-center"
                    >
                      <Ionicons name="add" size={16} color="#555" />
                    </Pressable>
                  </View>
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-[10px] text-[#9ca3af]">¥500</Text>
                  <Text className="text-[10px] text-[#9ca3af]">¥5000</Text>
                </View>
              </View>

              {/* Days slider */}
              <View className="mt-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-3">
                <View className="flex-row justify-between items-baseline">
                  <Text className="text-[12px] text-[#6b7280]">行程天数</Text>
                  <Text className="text-[16px] font-semibold text-[#166534]">
                    {days}
                    <Text className="text-[12px] text-[#6b7280] font-normal"> 天</Text>
                  </Text>
                </View>
                <View className="flex-row items-center mt-2">
                  {/* Day selector chips */}
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setDays(d)}
                      className={`flex-1 py-1.5 mx-0.5 rounded-lg items-center ${
                        days === d ? 'bg-[#22c55e]' : 'bg-[#e5e7eb]'
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-medium ${
                          days === d ? 'text-white' : 'text-[#6b7280]'
                        }`}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Preference tags */}
              <View className="mt-3">
                <Text className="text-[12px] text-[#6b7280] mb-1.5">
                  体验偏好（可多选）
                  <Text className="text-[10px] text-[#9ca3af]"> Optional</Text>
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PREFERENCE_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1.5 border ${
                          active
                            ? 'bg-[#dcfce7] border-[#22c55e]'
                            : 'bg-white border-[#e5e7eb]'
                        }`}
                      >
                        <Text
                          className={`text-[12px] ${
                            active ? 'text-[#166534] font-medium' : 'text-[#6b7280]'
                          }`}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Extra notes */}
              <View className="mt-3">
                <Text className="text-[12px] text-[#6b7280] mb-1">
                  补充说明（可选）
                  <Text className="text-[10px] text-[#9ca3af]"> 备注</Text>
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="例如：希望安排一晚精品民宿；多安排一些研学互动环节..."
                  placeholderTextColor="#cbd5e1"
                  multiline
                  numberOfLines={3}
                  className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-3 text-[13px] text-[#333]"
                  style={{ minHeight: 70, textAlignVertical: 'top' }}
                />
              </View>

              {/* Submit */}
              <Pressable
                onPress={generateTrip}
                disabled={planLoading || !origin.trim() || !destination.trim()}
                className="mt-4"
              >
                <LinearGradient
                  colors={
                    planLoading || !origin.trim() || !destination.trim()
                      ? ['#9ca3af', '#d1d5db']
                      : ['#22c55e', '#16a34a']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-full py-3 items-center flex-row justify-center"
                >
                  {planLoading ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="ml-2 text-[15px] font-semibold text-white">生成中...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#fff" />
                      <Text className="ml-1.5 text-[15px] font-semibold text-white">开始规划</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Results card */}
            {planResult && (
              <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-[#e5e7eb]">
                {/* Summary header */}
                <View className="flex-row justify-between items-center">
                  <Text className="text-[16px] font-semibold text-[#1a1a1a]">AI 行程方案</Text>
                  <Text className="text-[11px] text-[#9ca3af]">根据你的参数生成</Text>
                </View>
                <View className="h-0.5 rounded-full mt-2" style={{ backgroundColor: '#22c55e', opacity: 0.6 }} />
                <View className="flex-row flex-wrap gap-2 mt-3">
                  <View className="flex-row items-center bg-[#f3f4f6] rounded-full px-2.5 py-1 border border-[#e5e7eb]">
                    <View className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mr-1.5" />
                    <Text className="text-[11px] text-[#6b7280]">
                      路线：<Text className="font-medium text-[#333]">{planResult.route}</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center bg-[#f3f4f6] rounded-full px-2.5 py-1 border border-[#e5e7eb]">
                    <Text className="text-[11px] text-[#6b7280]">
                      天数：<Text className="font-medium text-[#333]">{planResult.days}</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center bg-[#f3f4f6] rounded-full px-2.5 py-1 border border-[#e5e7eb]">
                    <Text className="text-[11px] text-[#6b7280]">
                      人均：<Text className="font-medium text-[#333]">{planResult.budget}</Text>
                    </Text>
                  </View>
                </View>

                {/* Markdown content */}
                <View className="mt-3">{renderMarkdown(planResult.markdown)}</View>
              </View>
            )}

            {/* Empty state hint */}
            {!planResult && !planLoading && (
              <View className="mx-4 mt-5 items-center">
                <View className="bg-white rounded-2xl p-5 border border-[#e5e7eb] w-full items-center">
                  <Ionicons name="compass-outline" size={40} color="#d1d5db" />
                  <Text className="text-[13px] text-[#9ca3af] mt-2 text-center leading-5">
                    还没有生成行程，请在上方{'\n'}选择出发地和目的地，点击「开始规划」
                  </Text>
                  <Text className="text-[12px] text-[#b5b5b5] mt-1">
                    推荐组合：广州 → 潮州 · 3天 · ¥2000
                  </Text>
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <Text className="text-center text-[11px] text-[#b5b5b5] mt-6 px-6">
              温馨提示：实际出行请以当地开放时间、天气与交通信息为准，AI 方案仅作参考。
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ================================================================== */}
      {/* Chat Mode */}
      {/* ================================================================== */}
      {mode === 'chat' && (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={-insets.bottom}
        >
          <ScrollView
            ref={chatScrollRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 4 }}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          >
            {msgs.map((m, i) => (
              <View
                key={i}
                className={`mt-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.role === 'assistant' && (
                  <View className="flex-row items-center mb-1 ml-1">
                    <View className="w-6 h-6 rounded-full bg-[#22c55e] items-center justify-center">
                      <Ionicons name="flash" size={12} color="#fff" />
                    </View>
                    <Text className="text-[11px] text-[#9ca3af] ml-1.5">文脉粤游 AI</Text>
                  </View>
                )}
                <View
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === 'user'
                      ? 'bg-[#386641]'
                      : 'bg-white border border-[#e5e7eb] shadow-sm'
                  }`}
                >
                  <Text
                    className={`text-[14px] leading-5 ${
                      m.role === 'user' ? 'text-white' : 'text-[#333]'
                    }`}
                  >
                    {m.text}
                  </Text>
                </View>
              </View>
            ))}

            {/* Loading indicator */}
            {chatLoading && (
              <View className="mt-3 flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-[#22c55e] items-center justify-center mr-1.5">
                  <Ionicons name="flash" size={12} color="#fff" />
                </View>
                <View className="bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3">
                  <ActivityIndicator size="small" color={primary} />
                </View>
              </View>
            )}

            {/* Suggestion chips */}
            {msgs.length === 1 && !chatLoading && (
              <View className="mt-5">
                <Text className="text-[12px] text-[#9ca3af] mb-2 ml-1">试试问我：</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CHAT_SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => sendChat(s)}
                      className="rounded-full bg-white px-3.5 py-2 shadow-sm border border-[#e5e7eb]"
                    >
                      <Text className="text-[12px] text-[#386641]">{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Chat input bar */}
          <View
            style={{ paddingBottom: insets.bottom + 6 }}
            className="flex-row items-center border-t border-[#e5e7eb] bg-white px-3 pt-2 pb-1"
          >
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={() => sendChat()}
              placeholder="输入你的问题..."
              placeholderTextColor="#cbd5e1"
              className="flex-1 rounded-full bg-[#f3f4f6] px-4 py-2.5 text-[14px]"
              returnKeyType="send"
            />
            <Pressable
              onPress={() => sendChat()}
              disabled={!chatInput.trim() || chatLoading}
              className={`ml-2 rounded-full p-2.5 ${
                chatInput.trim() && !chatLoading ? 'bg-[#386641]' : 'bg-[#d1d5db]'
              }`}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
