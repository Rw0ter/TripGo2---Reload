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
import { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';

// ── Types ──────────────────────────────────────────────────
type Mode = 'planner' | 'chat';

const CHAT_SUGGESTIONS = [
  { text: '推荐一个广州三日游', icon: 'compass-outline' as const },
  { text: '岭南非遗文化有哪些？', icon: 'library-outline' as const },
  { text: '潮汕美食推荐', icon: 'restaurant-outline' as const },
  { text: '开平碉楼有什么历史？', icon: 'home-outline' as const },
  { text: '佛山醒狮表演在哪看？', icon: 'paw-outline' as const },
  { text: '广东省博物馆开放时间', icon: 'business-outline' as const },
];

const PREFERENCES = ['自然风光', '历史文化', '美食之旅', '非遗体验', '亲子游玩', '摄影打卡'];

const GD_CITIES = ['广州','深圳','珠海','佛山','东莞','中山','惠州','江门','肇庆','汕头','潮州','揭阳','汕尾','湛江','茂名','阳江','韶关','梅州','河源','清远','云浮'];

// ── AI fallback logic (same as before, condensed) ──────────
function generateReply(q: string): string {
  const l = q.toLowerCase();
  if (l.includes('非遗')||l.includes('粤剧')||l.includes('醒狮')||l.includes('广绣')||l.includes('工夫茶'))
    return '**岭南非遗文化**\n\n粤剧、醒狮、广绣、工夫茶等是岭南非遗的代表。推荐体验地：广州粤剧艺术博物馆、佛山祖庙、潮州古城。';
  if (l.includes('美食')||l.includes('吃')||l.includes('早茶')||l.includes('潮汕')||l.includes('顺德'))
    return '**广东美食指南**\n\n广府早茶、潮汕牛肉火锅、顺德鱼生、客家盐焗鸡——三大菜系各具风味。广州西华路、顺德大良、汕头小公园是最佳寻味地。';
  if (l.includes('碉楼')||l.includes('开平'))
    return '**开平碉楼**\n\n2007年列入世界文化遗产，现存约1833座。推荐自力村、马降龙、锦江里瑞石楼。广州出发约2小时车程。';
  if (l.includes('博物馆')||l.includes('开放时间'))
    return '**广东省博物馆**（珠江新城）：周二至周日 9:00-17:00，免费需预约。\n**粤剧艺术博物馆**（荔湾）：周二至周日 9:00-17:00。\n**佛山祖庙**：每日 8:30-17:30，门票20元。';
  if (l.includes('广州塔')||l.includes('广州')||l.includes('羊城'))
    return '**广州旅游攻略**\n\n必打卡：广州塔、珠江夜游、陈家祠、永庆坊、沙面岛。特色体验：早茶、西关骑楼漫步。周边：佛山20分钟高铁。';
  if (l.includes('深圳')) return '**深圳推荐**\n\n世界之窗、深圳湾公园、大梅沙、华侨城创意园。年轻活力的滨海都市。';
  return '很高兴收到你的问题！可以试试问我非遗文化、美食推荐、旅游攻略，或切换到"行程规划"模式生成专属行程。';
}

function generateTripPlan(from: string, to: string, budget: number, days: number, tags: string[], extra: string): string {
  const tagStr = tags.length > 0 ? tags.join('、') : '综合体验';
  let plan = `## ${from} → ${to} · ${days}天 · ¥${budget}/人\n\n`;
  plan += `> 偏好：${tagStr}${extra ? ' | ' + extra : ''}\n\n`;

  const citySpots: Record<string, string[]> = {
    '广州':['越秀公园+南越王博物院','陈家祠+永庆坊+沙面岛','广州塔+珠江夜游','白云山','省博物馆+花城广场'],
    '深圳':['世界之窗','深圳湾公园','大梅沙','华侨城创意园','海上世界'],
    '佛山':['祖庙+醒狮','南风古灶','顺德清晖园+美食','西樵山','岭南天地'],
    '珠海':['长隆海洋王国','情侣路+渔女','外伶仃岛','圆明新园','横琴花海'],
    '潮州':['古城+牌坊街','广济桥','开元寺','工夫茶体验','凤凰山茶园'],
  };
  const spots = citySpots[to] || ['市中心地标','当地公园','老街+美食','博物馆','特色体验'];

  for (let d = 0; d < Math.min(days, 5); d++) {
    const am = spots[(d*2) % spots.length];
    const pm = spots[(d*2+1) % spots.length];
    plan += `### 第${d+1}天\n`;
    plan += `- 上午：${am}\n- 下午：${pm}\n- 晚上：${d < days-1 ? '夜市漫步，感受在地烟火气' : '告别晚餐，整理旅途记忆'}\n\n`;
  }
  plan += `### 预算参考\n| 项目 | 费用 |\n|------|------|\n`;
  plan += `| 交通 | ¥${Math.round(budget*0.2)} |\n| 住宿 | ¥${Math.round(budget*0.35)} |\n`;
  plan += `| 餐饮 | ¥${Math.round(budget*0.25)} |\n| 门票 | ¥${Math.round(budget*0.15)} |\n`;
  plan += `| 其他 | ¥${budget-Math.round(budget*0.95)} |\n`;
  return plan;
}

// ── Markdown renderer ──────────────────────────────────────
function MdText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((raw, i) => {
        const t = raw.trim();
        const k = `md-${i}`;
        if (!t) return <View key={k} className="h-2" />;
        if (t.startsWith('## ')) return <Text key={k} className="mt-3 mb-1 text-[17px] font-extrabold text-[#1a1a1a]">{t.slice(3)}</Text>;
        if (t.startsWith('### ')) return <Text key={k} className="mt-2 mb-1 text-[15px] font-bold text-[#333]">{t.slice(4)}</Text>;
        if (t.startsWith('> ')) return <View key={k} className="my-1 rounded-lg border-l-4 border-[#386641] bg-[#F3FAF5] px-3 py-2"><Text className="text-[13px] italic text-[#555]">{t.slice(2)}</Text></View>;
        if (t.startsWith('|')) {
          const cells = t.split('|').filter(c => c.trim()).map(c => c.trim());
          if (cells.length === 2) return <View key={k} className="flex-row justify-between px-1 py-0.5"><Text className="text-[13px] text-[#777]">{cells[0]}</Text><Text className="text-[13px] font-medium text-[#333]">{cells[1]}</Text></View>;
          return null;
        }
        if (t.startsWith('- ')) return <View key={k} className="ml-2 mt-0.5 flex-row"><Text className="mr-1.5 text-[#386641]">•</Text><Text className="flex-1 text-[14px] leading-5 text-[#444]">{t.slice(2)}</Text></View>;
        return <Text key={k} className="mt-0.5 text-[14px] leading-5 text-[#444]">{t}</Text>;
      })}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('planner');

  // Chat state
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; text: string }[]>([{ role: 'assistant', text: '你好！我是文脉粤游智能助手 🤖\n我可以帮你规划行程、介绍岭南文化、推荐美食景点。试试问我吧！' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<ScrollView>(null);

  // Planner state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [budget, setBudget] = useState(2000);
  const [days, setDays] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState('');

  async function sendChat(q?: string) {
    const text = (q ?? chatInput).trim();
    if (!text || chatLoading) return;
    setMsgs(m => [...m, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
    setMsgs(m => [...m, { role: 'assistant', text: generateReply(text) }]);
    setChatLoading(false);
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function doPlan() {
    if (!from.trim() || !to.trim()) return;
    setPlanLoading(true);
    setPlanResult('');
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    setPlanResult(generateTripPlan(from.trim(), to.trim(), budget, days, tags, notes.trim()));
    setPlanLoading(false);
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#1B4332]">
        <ScreenHeader title="智能助手" tint="dark" />
        {/* Mode toggle */}
        <View className="mx-4 mb-4 flex-row rounded-xl bg-white/10 p-1">
          {(['planner', 'chat'] as Mode[]).map(m => {
            const active = mode === m;
            const label = m === 'planner' ? '行程规划' : 'AI 对话';
            const icon = m === 'planner' ? 'compass-outline' : 'chatbubble-ellipses-outline';
            return (
              <Pressable key={m} onPress={() => setMode(m)}
                className={`flex-1 flex-row items-center justify-center rounded-lg py-2.5 ${active ? 'bg-white shadow-sm' : ''}`}>
                <Ionicons name={icon} size={16} color={active ? '#1B4332' : 'rgba(255,255,255,0.8)'} />
                <Text className={`ml-1.5 text-[14px] font-semibold ${active ? 'text-[#1B4332]' : 'text-white/80'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Planner ──────────────────────────────────────── */}
      {mode === 'planner' && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(100).springify()} className="mx-4 mt-4 rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-sm">
              {/* From / To */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#999]">出发地</Text>
                  <View className="flex-row items-center rounded-xl bg-[#F5F5F5] px-3 py-3">
                    <Ionicons name="location-outline" size={16} color="#999" />
                    <TextInput value={from} onChangeText={setFrom} placeholder="广州" placeholderTextColor="#ccc" className="ml-2 flex-1 text-[15px] text-[#1a1a1a]" />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#999]">目的地</Text>
                  <View className="flex-row items-center rounded-xl bg-[#F5F5F5] px-3 py-3">
                    <Ionicons name="flag-outline" size={16} color="#999" />
                    <TextInput value={to} onChangeText={setTo} placeholder="潮州" placeholderTextColor="#ccc" className="ml-2 flex-1 text-[15px] text-[#1a1a1a]" />
                  </View>
                </View>
              </View>

              {/* Budget */}
              <View className="mt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[12px] font-semibold uppercase tracking-wider text-[#999]">人均预算</Text>
                  <Text className="text-[18px] font-extrabold text-[#1B4332]">¥{budget}</Text>
                </View>
                <View className="mt-2 flex-row items-center gap-2">
                  {[500, 1000, 2000, 3000, 5000].map(v => (
                    <Pressable key={v} onPress={() => setBudget(v)}
                      className={`flex-1 rounded-lg py-2 ${budget === v ? 'bg-[#1B4332]' : 'bg-[#F5F5F5]'}`}>
                      <Text className={`text-center text-[12px] font-semibold ${budget === v ? 'text-white' : 'text-[#777]'}`}>¥{v >= 1000 ? v / 1000 + 'k' : v}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Days */}
              <View className="mt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[12px] font-semibold uppercase tracking-wider text-[#999]">行程天数</Text>
                  <Text className="text-[18px] font-extrabold text-[#1B4332]">{days} 天</Text>
                </View>
                <View className="mt-2 flex-row gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <Pressable key={d} onPress={() => setDays(d)}
                      className={`h-9 flex-1 items-center justify-center rounded-lg ${days === d ? 'bg-[#1B4332]' : 'bg-[#F5F5F5]'}`}>
                      <Text className={`text-[14px] font-semibold ${days === d ? 'text-white' : 'text-[#777]'}`}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Preferences */}
              <View className="mt-4">
                <Text className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#999]">体验偏好</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PREFERENCES.map(t => {
                    const active = tags.includes(t);
                    return (
                      <Pressable key={t} onPress={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                        className={`rounded-full px-3.5 py-2 ${active ? 'bg-[#1B4332]' : 'border border-[#ECECEC] bg-white'}`}>
                        <Text className={`text-[12px] font-medium ${active ? 'text-white' : 'text-[#666]'}`}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Notes */}
              <View className="mt-4">
                <Text className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#999]">补充说明</Text>
                <TextInput value={notes} onChangeText={setNotes} placeholder="民宿、研学、特殊需求…" placeholderTextColor="#ccc"
                  multiline className="rounded-xl bg-[#F5F5F5] p-3 text-[14px] text-[#333]" style={{ minHeight: 60, textAlignVertical: 'top' }} />
              </View>

              {/* Submit */}
              <Pressable onPress={doPlan} disabled={planLoading || !from.trim() || !to.trim()} className="mt-5">
                <LinearGradient colors={planLoading || !from.trim() || !to.trim() ? ['#ccc','#aaa'] : ['#1B4332','#2D6A4F']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-row items-center justify-center rounded-2xl py-4">
                  {planLoading ? (
                    <><ActivityIndicator color="#fff" size="small" /><Text className="ml-2 text-[15px] font-bold text-white">生成中…</Text></>
                  ) : (
                    <><Ionicons name="sparkles-outline" size={18} color="#fff" /><Text className="ml-2 text-[15px] font-bold text-white">开始规划</Text></>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Result */}
            {planResult && (
              <Animated.View entering={FadeInDown.delay(200).springify()} className="mx-4 mt-4 rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-sm">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-[17px] font-extrabold text-[#1a1a1a]">AI 行程方案</Text>
                  <View className="rounded-full bg-[#E8F5E9] px-3 py-1">
                    <Text className="text-[11px] font-semibold text-[#1B4332]">已生成</Text>
                  </View>
                </View>
                <MdText text={planResult} />
              </Animated.View>
            )}

            {/* Empty hint */}
            {!planResult && !planLoading && (
              <Animated.View entering={FadeIn.delay(500).springify()} className="mx-4 mt-6 items-center rounded-2xl bg-[#F9F9F9] p-6">
                <Ionicons name="compass-outline" size={40} color="#ddd" />
                <Text className="mt-3 text-[14px] text-[#bbb]">选择出发地和目的地，点击"开始规划"</Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Chat ──────────────────────────────────────────── */}
      {mode === 'chat' && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
          <ScrollView ref={chatRef} className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 12, paddingTop: 12 }}
            onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {msgs.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <Animated.View key={i} entering={FadeInDown.delay(80).springify()} className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  {!isUser && (
                    <View className="mb-1 ml-1 flex-row items-center gap-1.5">
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-[#1B4332]">
                        <Ionicons name="sparkles" size={10} color="#fff" />
                      </View>
                      <Text className="text-[11px] font-medium text-[#999]">AI 助手</Text>
                    </View>
                  )}
                  <View className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-[#1B4332]' : 'border border-[#ECECEC] bg-white'}`}>
                    <Text className={`text-[14px] leading-6 ${isUser ? 'text-white' : 'text-[#333]'}`}>{m.text}</Text>
                  </View>
                </Animated.View>
              );
            })}

            {chatLoading && (
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-5 w-5 items-center justify-center rounded-full bg-[#1B4332]"><Ionicons name="sparkles" size={10} color="#fff" /></View>
                <View className="rounded-2xl border border-[#ECECEC] bg-white px-4 py-3"><ActivityIndicator size="small" color="#1B4332" /></View>
              </View>
            )}

            {/* Suggestions */}
            {msgs.length === 1 && !chatLoading && (
              <Animated.View entering={FadeIn.delay(300).springify()} className="mt-4">
                <Text className="mb-2 ml-1 text-[13px] font-semibold text-[#999]">试试问我</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CHAT_SUGGESTIONS.map(s => (
                    <Pressable key={s.text} onPress={() => sendChat(s.text)}
                      className="flex-row items-center rounded-full border border-[#ECECEC] bg-white px-3.5 py-2.5 active:bg-[#F5F5F5]">
                      <Ionicons name={s.icon} size={14} color="#1B4332" />
                      <Text className="ml-1.5 text-[13px] text-[#444]">{s.text}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Chat input */}
          <View className="flex-row items-center border-t border-[#ECECEC] bg-white px-3 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
            <TextInput value={chatInput} onChangeText={setChatInput} onSubmitEditing={() => sendChat()} placeholder="输入问题…" placeholderTextColor="#ccc"
              className="flex-1 rounded-full bg-[#F5F5F5] px-4 py-3 text-[14px]" returnKeyType="send" />
            <Pressable onPress={() => sendChat()} disabled={!chatInput.trim() || chatLoading}
              className={`ml-2 h-10 w-10 items-center justify-center rounded-full ${chatInput.trim() && !chatLoading ? 'bg-[#1B4332]' : 'bg-[#E5E5E5]'}`}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
