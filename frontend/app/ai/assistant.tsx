import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUGGESTIONS = [
  '推荐一个广州三日游行程',
  '岭南非遗文化有哪些？',
  '潮汕美食推荐',
  '广东省博物馆开放时间',
];

interface MsgItem { role: 'user' | 'assistant'; text: string; }

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [msgs, setMsgs] = useState<MsgItem[]>([
    { role: 'assistant', text: '你好！我是文脉粤游智能助手 🤖\n我可以帮你规划行程、介绍岭南文化、推荐美食景点。试试问我吧！' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(q: string) {
    const query = q || input.trim();
    if (!query || loading) return;
    const userMsg: MsgItem = { role: 'user', text: query };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    // Simulate AI response (backend AI integration to be added later)
    setTimeout(() => {
      const replies = [
        '好的！让我为你详细介绍一下...\n\n岭南文化博大精深，涵盖了粤剧、广绣、醒狮、工夫茶等多个非遗项目。建议你可以从广州开始，沿着珠江三角洲一路探索。',
        '这是个好问题！广东省拥有丰富的非物质文化遗产，其中粤剧已被列入联合国人类非物质文化遗产代表作名录。此外广绣、潮绣、醒狮、龙舟等也是国家级非遗。',
        '推荐你去这几个地方：\n📍 广州粤剧艺术博物馆\n📍 佛山祖庙（醒狮表演）\n📍 潮州古城（工夫茶体验）\n📍 开平碉楼（世界文化遗产）',
        '建议行程：\nDay 1: 广州 → 越秀公园 → 粤剧博物馆 → 珠江夜游\nDay 2: 佛山 → 祖庙 → 南风古灶 → 顺德美食\nDay 3: 中山 → 孙中山故居 → 詹园 → 珠海',
      ];
      const ai: MsgItem = { role: 'assistant', text: replies[Math.floor(Math.random() * replies.length)] };
      setMsgs((m) => [...m, ai]);
      setLoading(false);
    }, 1200);
  }

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-[#3E6B4F] px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View className="flex-row items-center">
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#5BE1B2' }} className="items-center justify-center">
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <Text className="ml-2 text-[17px] font-bold text-white">智能助手</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" ref={(ref) => { /* auto scroll */ }} contentContainerStyle={{ paddingBottom: 16 }}>
        {msgs.map((m, i) => (
          <View key={i} className={`mt-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <View className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-[#386641]' : 'bg-white shadow-sm'}`}>
              <Text className={`text-[14px] leading-5 ${m.role === 'user' ? 'text-white' : 'text-[#333]'}`}>{m.text}</Text>
            </View>
          </View>
        ))}
        {loading ? (
          <View className="mt-3 items-center">
            <ActivityIndicator color="#386641" />
          </View>
        ) : msgs.length === 1 ? (
          <View className="mt-5 flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => send(s)} className="rounded-full bg-white px-3.5 py-2 shadow-sm">
                <Text className="text-[12px] text-[#386641]">{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Input bar */}
      <View style={{ paddingBottom: insets.bottom + 6 }} className="flex-row items-center border-t border-[#eee] bg-white px-3 pt-2">
        <TextInput value={input} onChangeText={setInput} onSubmitEditing={() => send(input)} placeholder="输入你的问题..." className="flex-1 rounded-full bg-[#F2F2F2] px-4 py-2.5 text-[14px]" />
        <Pressable onPress={() => send(input)} className="ml-2 rounded-full bg-[#386641] p-2.5">
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
