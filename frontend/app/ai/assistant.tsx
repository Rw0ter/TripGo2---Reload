import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown, FadeIn, FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';

// ── Types ──────────────────────────────────────────────────
type Mode = 'planner' | 'chat';
interface Message { role: 'user' | 'assistant'; text: string; }

// ── Constants ──────────────────────────────────────────────
const WELCOME_MSG: Message = {
  role: 'assistant',
  text: '你好！我是文脉粤游的智能旅行助手。\n\n我可以帮你规划岭南地区的旅行行程，介绍非遗文化和美食，推荐景点和路线。\n\n💡 试试切换到「行程规划」模式，输入出发地和目的地，我就能为你生成一份完整的旅行计划。',
};

const SUGGESTIONS = [
  { text: '推荐一个广州三日游行程', icon: 'compass-outline' },
  { text: '广东有什么非遗文化？', icon: 'library-outline' },
  { text: '潮汕地区有什么好吃的？', icon: 'restaurant-outline' },
  { text: '开平碉楼在哪里？怎么去？', icon: 'home-outline' },
  { text: '佛山醒狮表演在哪里看？', icon: 'paw-outline' },
  { text: '广东有哪些世界文化遗产？', icon: 'globe-outline' },
];

const PREFERENCES = [
  { key: 'nature', label: '自然风光', icon: 'leaf-outline' },
  { key: 'culture', label: '历史文化', icon: 'library-outline' },
  { key: 'food', label: '美食之旅', icon: 'restaurant-outline' },
  { key: 'heritage', label: '非遗体验', icon: 'color-palette-outline' },
  { key: 'family', label: '亲子游玩', icon: 'people-outline' },
  { key: 'photo', label: '摄影打卡', icon: 'camera-outline' },
];

// ── AI Logic ───────────────────────────────────────────────
function generateReply(q: string): string {
  const l = q.toLowerCase();
  if (/非遗|粤剧|醒狮|广绣|工夫茶|英歌舞|灰塑|龙舟/.test(l))
    return '岭南非遗文化丰富多彩，以下是最具代表性的项目：\n\n🎭 **粤剧** — 联合国人类非物质文化遗产，又称"广东大戏"，唱腔婉转，服饰华丽。\n\n🦁 **醒狮** — 佛山醒狮最为著名，鼓点激昂，动作刚劲，每逢节庆必有表演。\n\n🪡 **广绣** — 中国四大名绣之一，色彩饱满，构图繁而不乱。\n\n🍵 **工夫茶** — 潮汕茶文化精髓，讲究"和、敬、精、乐"。\n\n🏺 **石湾陶塑** — 佛山千年窑火，人物造型栩栩如生。\n\n推荐体验地：广州粤剧艺术博物馆、佛山祖庙、潮州古城、石湾南风古灶。';
  if (/美食|吃|好吃|早茶|潮汕|顺德|客家|点心|烧鹅|白切鸡|肠粉/.test(l))
    return '🍜 **广东美食天堂**\n\n广东是公认的美食天堂，三大菜系各具特色：\n\n**广府菜** — 清淡鲜美\n早茶（虾饺、烧卖、叉烧包、凤爪）是广州人的日常仪式。推荐：广州酒家、陶陶居、泮溪酒家。\n\n**潮汕菜** — 精致细腻\n牛肉火锅、卤鹅、蚝烙、粿条汤。推荐：汕头小公园、潮州牌坊街。\n\n**顺德菜** — 世界美食之都\n鱼生、双皮奶、均安蒸猪、大良炒牛奶。推荐：大良华盖路、容桂渔人码头。\n\n**客家菜** — 咸香浓郁\n盐焗鸡、梅菜扣肉、酿豆腐。推荐：梅州、河源。';
  if (/碉楼|开平|华侨|世界遗产|自力村/.test(l))
    return '🏛️ **开平碉楼与村落**\n\n2007 年列入联合国世界文化遗产，是广东首个世界文化遗产。\n\n现存约 1833 座碉楼，集防卫、居住和中西建筑艺术于一体。最具代表性的村落：\n\n• **自力村** — 最集中，15 座碉楼，田园环绕\n• **马降龙** — 被誉为"世界最美村落"之一\n• **锦江里瑞石楼** — 开平第一楼，9 层高\n• **立园** — 华侨私家园林\n\n🚗 广州出发约 2 小时，高铁到开平南站后换乘公交。\n📅 最佳季节：春秋（3-5 月、9-11 月），稻田环绕时拍照最美。';
  if (/博物馆|开放时间|展览|省博/.test(l))
    return '🏛️ **广东主要博物馆**\n\n**广东省博物馆**（珠江新城）\n周二至周日 9:00-17:00，周一闭馆，免费需预约。\n\n**广州粤剧艺术博物馆**（荔湾恩宁路）\n周二至周日 9:00-17:00，免费需预约。\n\n**南越王博物院**（越秀）\n周二至周日 9:00-17:30，门票 10 元。\n\n**佛山祖庙博物馆**\n每日 8:30-17:30，门票 20 元。\n\n**深圳博物馆**（福田）\n周二至周日 10:00-18:00，免费免预约。';
  if (/广州|羊城|花城|珠江|小蛮腰|广州塔/.test(l))
    return '🏙️ **广州 — 千年商都**\n\n必打卡景点：\n• 广州塔 — 600 米高空俯瞰珠江新城\n• 陈家祠 — 岭南建筑艺术集大成者\n• 永庆坊 — 西关老城活化，地道广府生活\n• 沙面岛 — 欧陆风情建筑群，拍照圣地\n• 越秀公园 — 五羊石像，广州地标\n• 珠江夜游 — 两岸灯光秀，19:30-21:00 最佳\n\n🍵 特色体验：早茶、西关骑楼漫步、荔枝湾涌游船。\n🚄 周边：佛山 20 分钟高铁、顺德美食半日可达。';
  return '很高兴收到你的问题！我可以帮你了解岭南文化、规划旅行行程、推荐美食景点。\n\n试试问我：\n• "推荐一个广州三日游行程"\n• "广东有哪些非遗文化？"\n• "潮汕有什么好吃的？"\n• "开平碉楼在哪里？怎么去？"\n\n或者切换到「行程规划」模式，我会为你生成一份完整的旅行计划 ✈️';
}

function generatePlan(from: string, to: string, budget: number, days: number, tags: string[], notes: string): string {
  const spots: Record<string, string[]> = {
    '广州': ['越秀公园 · 五羊石像', '陈家祠 · 永庆坊 · 沙面岛', '广州塔 · 花城广场 · 珠江夜游', '白云山 · 云台花园', '南越王博物院 · 北京路'],
    '深圳': ['世界之窗 · 锦绣中华', '深圳湾公园 · 人才公园', '大梅沙海滨公园', '华侨城创意园 · OCT LOFT', '蛇口海上世界 · 明华轮'],
    '佛山': ['祖庙 · 醒狮表演', '南风古灶 · 石湾公仔街', '顺德清晖园 · 大良美食', '西樵山 · 南海观音', '岭南天地 · 筷子路'],
    '珠海': ['长隆海洋王国', '情侣路 · 珠海渔女 · 日月贝', '外伶仃岛 · 海岛度假', '圆明新园 · 梦幻水城', '港珠澳大桥 · 人工岛'],
    '潮州': ['牌坊街 · 甲第巷 · 己略黄公祠', '广济桥 · 韩文公祠', '开元寺 · 潮州西湖', '凤凰山 · 凤凰单丛茶园', '龙湖古寨'],
    '汕头': ['小公园 · 骑楼群 · 老妈宫', '南澳岛 · 青澳湾', '礐石风景区', '陈慈黉故居 · 前美村', '东海岸新城'],
    '韶关': ['丹霞山 · 长老峰 · 阳元石', '南华寺 · 六祖道场', '云门山 · 玻璃桥', '珠玑古巷 · 梅关古道', '帽子峰林场'],
    '梅州': ['客天下 · 客家小镇', '雁南飞茶田', '花萼楼 · 围龙屋群', '叶剑英纪念园', '灵光寺 · 阴那山'],
  };
  const citySpots = spots[to] || [`${to}中心城区`, `${to}文化地标`, `${to}自然风光`, `${to}特色街区`, `${to}周边景点`];

  let plan = `## 🗺️ ${from} → ${to}\n`;
  plan += `> ${days} 天行程 · 人均 ¥${budget} · ${tags.length > 0 ? tags.join(' · ') : '综合体验'}\n\n`;

  for (let d = 0; d < days; d++) {
    const morning = citySpots[(d * 2) % citySpots.length];
    const afternoon = citySpots[(d * 2 + 1) % citySpots.length];
    plan += `### 📅 第 ${d + 1} 天\n`;
    plan += `- **上午** — ${morning}，感受${to}的独特魅力\n`;
    plan += `- **午餐** — 品尝${to}当地特色美食\n`;
    plan += `- **下午** — ${afternoon}，深度体验在地文化\n`;
    plan += `- **晚上** — ${d < days - 1 ? '漫步夜市或江边，融入当地夜生活' : '享用告别晚餐，整理旅途记忆'}\n\n`;
  }

  const transport = Math.round(budget * 0.22);
  const lodging = Math.round(budget * 0.35);
  const dining = Math.round(budget * 0.25);
  const tickets = Math.round(budget * 0.13);
  const misc = budget - transport - lodging - dining - tickets;

  plan += `### 💰 预算明细\n`;
  plan += `| 项目 | 人均费用 |\n|------|----------|\n`;
  plan += `| 往返交通 | ¥${transport} |\n`;
  plan += `| 住宿（${Math.max(days - 1, 1)} 晚） | ¥${lodging} |\n`;
  plan += `| 餐饮 | ¥${dining} |\n`;
  plan += `| 门票 + 体验 | ¥${tickets} |\n`;
  plan += `| 其他 | ¥${misc} |\n\n`;

  plan += `### 📝 行前贴士\n`;
  plan += `- 提前查看${to}天气预报，准备合适的衣物\n`;
  plan += `- 热门景点建议提前线上预约购票\n`;
  plan += `- 下载离线地图，山区可能信号不稳定\n`;
  if (tags.includes('美食之旅')) plan += `- 备一些肠胃药，尽情品尝美食也要注意肠胃健康\n`;
  if (tags.includes('非遗体验')) plan += `- 非遗体验项目建议提前电话确认开放情况和预约要求\n`;
  plan += `- 携带适量现金，部分老店和小摊可能不支持扫码支付\n`;
  if (notes) plan += `- 补充需求：${notes}\n`;

  return plan;
}

// ── Chat Bubble ────────────────────────────────────────────
function ChatBubble({ msg, index }: { msg: Message; index: number }) {
  const isUser = msg.role === 'user';
  return (
    <Animated.View
      entering={isUser ? FadeInRight.delay(60).springify() : FadeInLeft.delay(60).springify()}
      className={`mb-4 ${isUser ? 'ml-10' : 'mr-10'}`}>
      {!isUser && (
        <View className="mb-1.5 ml-1 flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9]">
            <Ionicons name="sparkles" size={13} color="#2D6A4F" />
          </View>
          <Text className="text-[12px] font-medium text-[#999]">TripGo AI</Text>
        </View>
      )}
      <View
        className={`rounded-[20px] px-4 py-3 ${
          isUser
            ? 'rounded-tr-md bg-[#2D6A4F]'
            : 'rounded-tl-md border border-[#EBEBEB] bg-white'
        }`}
        style={!isUser ? { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : {}}>
        <Text className={`text-[15px] leading-6 ${isUser ? 'text-white' : 'text-[#222]'}`}>
          {msg.text}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Welcome State ──────────────────────────────────────────
function WelcomeState({ onTap }: { onTap: (q: string) => void }) {
  return (
    <Animated.View entering={FadeIn.delay(200).springify()} className="px-2 pt-4">
      <Text className="mb-4 text-center text-[13px] font-medium text-[#bbb]">
        你可以问我关于广东旅游的任何问题
      </Text>
      <View className="flex-row flex-wrap justify-center gap-2.5">
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.text}
            onPress={() => onTap(s.text)}
            className="flex-row items-center rounded-full border border-[#EBEBEB] bg-white px-4 py-2.5 active:bg-[#F9F9F9]"
            style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
            <Ionicons name={s.icon as any} size={15} color="#2D6A4F" />
            <Text className="ml-2 text-[13px] text-[#444]">{s.text}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Planner Form ───────────────────────────────────────────
function PlannerForm({
  from, setFrom, to, setTo, budget, setBudget, days, setDays,
  tags, setTags, notes, setNotes, loading, onSubmit,
}: {
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  budget: number; setBudget: (v: number) => void;
  days: number; setDays: (v: number) => void;
  tags: string[]; setTags: (v: string[] | ((p: string[]) => string[])) => void;
  notes: string; setNotes: (v: string) => void;
  loading: boolean; onSubmit: () => void;
}) {
  const canSubmit = from.trim().length > 0 && to.trim().length > 0;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white p-5"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
      {/* From / To */}
      <View className="flex-row gap-3">
        {[['出发地', 'location-outline', '广州', from, setFrom] as const, ['目的地', 'flag-outline', '潮州', to, setTo] as const].map(([label, icon, ph, val, setter]) => (
          <View key={label} className="flex-1">
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">{label}</Text>
            <View className="flex-row items-center rounded-xl bg-[#F8F8F8] px-3.5 py-3.5">
              <Ionicons name={icon} size={17} color="#bbb" />
              <TextInput value={val} onChangeText={setter} placeholder={ph} placeholderTextColor="#ccc"
                className="ml-2 flex-1 text-[16px] font-medium text-[#111]" />
            </View>
          </View>
        ))}
      </View>

      {/* Budget */}
      <View className="mt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">预算 / 人</Text>
          <Text className="text-[20px] font-extrabold text-[#2D6A4F]">¥{budget.toLocaleString()}</Text>
        </View>
        <View className="mt-2.5 flex-row gap-2">
          {[500, 1000, 2000, 3000, 5000].map(v => (
            <Pressable key={v} onPress={() => setBudget(v)}
              className={`flex-1 rounded-xl py-2.5 ${budget === v ? 'bg-[#2D6A4F]' : 'bg-[#F8F8F8]'}`}>
              <Text className={`text-center text-[13px] font-semibold ${budget === v ? 'text-white' : 'text-[#888]'}`}>
                ¥{v >= 1000 ? `${v / 1000}k` : v}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Days */}
      <View className="mt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">天数</Text>
          <Text className="text-[20px] font-extrabold text-[#2D6A4F]">{days} 天</Text>
        </View>
        <View className="mt-2.5 flex-row gap-2">
          {[1, 2, 3, 4, 5, 7].map(d => (
            <Pressable key={d} onPress={() => setDays(d)}
              className={`flex-1 rounded-xl py-2.5 ${days === d ? 'bg-[#2D6A4F]' : 'bg-[#F8F8F8]'}`}>
              <Text className={`text-center text-[14px] font-semibold ${days === d ? 'text-white' : 'text-[#888]'}`}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Preferences */}
      <View className="mt-5">
        <Text className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">偏好</Text>
        <View className="flex-row flex-wrap gap-2">
          {PREFERENCES.map(p => {
            const active = tags.includes(p.key);
            return (
              <Pressable key={p.key}
                onPress={() => setTags(prev => prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key])}
                className={`flex-row items-center rounded-full px-3.5 py-2 ${active ? 'bg-[#2D6A4F]' : 'border border-[#EBEBEB] bg-white'}`}>
                <Ionicons name={p.icon as any} size={13} color={active ? '#fff' : '#999'} />
                <Text className={`ml-1.5 text-[12px] font-medium ${active ? 'text-white' : 'text-[#666]'}`}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View className="mt-4">
        <TextInput value={notes} onChangeText={setNotes}
          placeholder="补充说明：民宿偏好、特殊需求…"
          placeholderTextColor="#ccc" multiline
          className="rounded-xl bg-[#F8F8F8] p-3.5 text-[14px] text-[#444]"
          style={{ minHeight: 52, textAlignVertical: 'top' }} />
      </View>

      {/* Submit */}
      <Pressable onPress={onSubmit} disabled={!canSubmit || loading} className="mt-5">
        <LinearGradient
          colors={canSubmit && !loading ? ['#2D6A4F', '#40916C', '#52B788'] : ['#ccc', '#bbb']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          className="flex-row items-center justify-center rounded-2xl py-4">
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-[16px] font-bold text-white">正在生成行程…</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
              <Text className="text-[16px] font-bold text-white">生成行程</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Plan Result ────────────────────────────────────────────
function PlanResult({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} className="mx-4 mt-4 rounded-2xl border border-[#EBEBEB] bg-white p-5"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold text-[#111]">你的专属行程</Text>
        <View className="rounded-full bg-[#E8F5E9] px-3 py-1">
          <Text className="text-[11px] font-semibold text-[#2D6A4F]">AI 生成</Text>
        </View>
      </View>
      <View className="h-px bg-[#F0F0F0] mb-4" />
      {lines.map((raw, i) => {
        const t = raw.trim();
        const k = `r-${i}`;
        if (!t) return <View key={k} className="h-2.5" />;
        if (t.startsWith('## ')) return <Text key={k} className="mt-4 mb-1 text-[18px] font-extrabold text-[#111]">{t.slice(3)}</Text>;
        if (t.startsWith('### ')) return <Text key={k} className="mt-3 mb-1 text-[16px] font-bold text-[#2D6A4F]">{t.slice(4)}</Text>;
        if (t.startsWith('> ')) return <View key={k} className="my-1.5 rounded-xl border-l-4 border-[#2D6A4F] bg-[#F3FAF5] px-4 py-2.5"><Text className="text-[13px] italic leading-5 text-[#555]">{t.slice(2)}</Text></View>;
        if (t.startsWith('|')) {
          const cells = t.split('|').filter(c => c.trim()).map(c => c.trim());
          if (cells.length === 2 && !t.includes('---'))
            return <View key={k} className="flex-row justify-between px-2 py-1"><Text className="text-[14px] text-[#888]">{cells[0]}</Text><Text className="text-[14px] font-semibold text-[#333]">{cells[1]}</Text></View>;
          if (t.includes('---')) return <View key={k} className="h-px bg-[#F0F0F0] my-1" />;
          return null;
        }
        if (t.startsWith('- ')) {
          const boldMatch = t.match(/\*\*(.+?)\*\*/);
          const content = t.slice(2);
          if (boldMatch) {
            const parts = content.split(/\*\*(.+?)\*\*/);
            return (
              <View key={k} className="ml-1 mt-1 flex-row">
                <Text className="mr-2 mt-0.5 text-[#2D6A4F]">•</Text>
                <Text className="flex-1 text-[14px] leading-6 text-[#444]">
                  {parts.map((p, j) => j % 2 === 1 ? <Text key={j} className="font-semibold text-[#333]">{p}</Text> : <Text key={j}>{p}</Text>)}
                </Text>
              </View>
            );
          }
          return (
            <View key={k} className="ml-1 mt-1 flex-row">
              <Text className="mr-2 mt-0.5 text-[#2D6A4F]">•</Text>
              <Text className="flex-1 text-[14px] leading-6 text-[#444]">{content}</Text>
            </View>
          );
        }
        return <Text key={k} className="mt-1 text-[14px] leading-6 text-[#444]">{t}</Text>;
      })}
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────
export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('chat');

  // Chat
  const [msgs, setMsgs] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<ScrollView>(null);

  // Planner
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [budget, setBudget] = useState(2000);
  const [days, setDays] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState('');

  async function send(q?: string) {
    const text = (q ?? input).trim();
    if (!text || chatLoading) return;
    setMsgs(m => [...m, { role: 'user', text }]);
    setInput('');
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    setMsgs(m => [...m, { role: 'assistant', text: generateReply(text) }]);
    setChatLoading(false);
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function doPlan() {
    if (!from.trim() || !to.trim()) return;
    setPlanLoading(true);
    setPlanResult('');
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    setPlanResult(generatePlan(from.trim(), to.trim(), budget, days, tags, notes.trim()));
    setPlanLoading(false);
  }

  const isWelcome = msgs.length === 1 && msgs[0].role === 'assistant' && msgs[0].text === WELCOME_MSG.text;

  return (
    <View className="flex-1 bg-white">
      {/* ── Header ────────────────────────────────────────── */}
      <View className="bg-[#1B4332]">
        <ScreenHeader title="智能助手" tint="dark" />

        <View className="mx-4 mb-4 flex-row rounded-xl bg-white/10 p-1">
          {(['chat', 'planner'] as Mode[]).map(m => {
            const active = mode === m;
            const isChat = m === 'chat';
            return (
              <Pressable key={m} onPress={() => setMode(m)}
                className={`flex-1 flex-row items-center justify-center rounded-lg py-2.5 ${active ? 'bg-white shadow-sm' : ''}`}>
                <Ionicons name={isChat ? 'chatbubble-ellipses-outline' : 'compass-outline'} size={17}
                  color={active ? '#1B4332' : 'rgba(255,255,255,0.8)'} />
                <Text className={`ml-2 text-[14px] font-semibold ${active ? 'text-[#1B4332]' : 'text-white/80'}`}>
                  {isChat ? 'AI 对话' : '行程规划'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Chat Mode ─────────────────────────────────────── */}
      {mode === 'chat' && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
          <ScrollView ref={chatRef} className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 8, paddingTop: 8 }}
            onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {msgs.map((m, i) => (
              <ChatBubble key={i} msg={m} index={i} />
            ))}
            {chatLoading && (
              <View className="mb-4 mr-10 flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9]">
                  <Ionicons name="sparkles" size={13} color="#2D6A4F" />
                </View>
                <View className="rounded-[20px] rounded-tl-md border border-[#EBEBEB] bg-white px-5 py-3">
                  <ActivityIndicator size="small" color="#2D6A4F" />
                </View>
              </View>
            )}
            {isWelcome && <WelcomeState onTap={send} />}
          </ScrollView>

          {/* Input */}
          <View className="flex-row items-center gap-2 border-t border-[#F0F0F0] bg-white px-3 pt-2.5" style={{ paddingBottom: insets.bottom + 10 }}>
            <TextInput value={input} onChangeText={setInput} onSubmitEditing={() => send()} placeholder="输入问题…" placeholderTextColor="#ccc"
              className="flex-1 rounded-2xl bg-[#F5F5F5] px-4 py-3 text-[15px]" returnKeyType="send" />
            <Pressable onPress={() => send()} disabled={!input.trim() || chatLoading}
              className={`h-11 w-11 items-center justify-center rounded-full ${input.trim() && !chatLoading ? 'bg-[#2D6A4F]' : 'bg-[#E8E8E8]'}`}
              style={input.trim() && !chatLoading ? { shadowColor: '#2D6A4F', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } : {}}>
              <Ionicons name="arrow-up" size={22} color={input.trim() && !chatLoading ? '#fff' : '#bbb'} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Planner Mode ──────────────────────────────────── */}
      {mode === 'planner' && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <PlannerForm
              from={from} setFrom={setFrom} to={to} setTo={setTo}
              budget={budget} setBudget={setBudget} days={days} setDays={setDays}
              tags={tags} setTags={setTags} notes={notes} setNotes={setNotes}
              loading={planLoading} onSubmit={doPlan} />

            {planResult && <PlanResult text={planResult} />}

            {!planResult && !planLoading && (
              <Animated.View entering={FadeInDown.delay(300).springify()} className="mx-4 mt-6 items-center rounded-2xl bg-[#F9F9F9] py-10">
                <Ionicons name="compass-outline" size={44} color="#e0e0e0" />
                <Text className="mt-4 text-[15px] font-medium text-[#ccc]">设置出发地和目的地</Text>
                <Text className="mt-1 text-[13px] text-[#ddd]">点击「生成行程」获取 AI 规划</Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
