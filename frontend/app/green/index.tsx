import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SW = Dimensions.get('window').width;
const HERO_H = 440;

export default function GreenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const onScroll = RNAnimated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const heroY = scrollY.interpolate({ inputRange: [-200, 0, HERO_H], outputRange: [-80, 0, 200], extrapolate: 'clamp' });
  const heroS = scrollY.interpolate({ inputRange: [-200, 0, HERO_H], outputRange: [1.2, 1, 0.82], extrapolate: 'clamp' });
  const heroO = scrollY.interpolate({ inputRange: [100, HERO_H * 0.45, HERO_H], outputRange: [1, 0.35, 0], extrapolate: 'clamp' });

  const s = (start: number) => ({
    y: scrollY.interpolate({ inputRange: [start - 40, start + 60, start + 180], outputRange: [36, 12, 0], extrapolate: 'clamp' }),
    o: scrollY.interpolate({ inputRange: [start - 40, start + 30, start + 140], outputRange: [0, 0.45, 1], extrapolate: 'clamp' }),
    sx: scrollY.interpolate({ inputRange: [start - 40, start + 60, start + 160], outputRange: [0.94, 0.98, 1], extrapolate: 'clamp' }),
  });

  const sec1 = s(120);
  const sec2 = s(520);
  const sec3 = s(920);
  const sec4 = s(1320);
  const cta = s(1720);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F8F3' }}>
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} onScroll={onScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>

        {/* ── HERO ── */}
        <View style={{ height: HERO_H, overflow: 'hidden' }}>
          <RNAnimated.View style={{
            transform: [{ translateY: heroY }, { scale: heroS }], opacity: heroO,
            position: 'absolute', top: -60, left: 0, right: 0, height: HERO_H + 120,
          }}>
            <Image source={require('../../assets/images/green/hero_climate.jpg')}
              style={{ width: SW, height: HERO_H + 120 }} resizeMode="cover" />
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(245,248,243,0.88)', '#F5F8F3']}
              locations={[0, 0.55, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }} />
          </RNAnimated.View>

          <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 12, left: 20, zIndex: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)',
              alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={20} color="rgba(0,0,0,0.5)" />
            </View>
          </Pressable>

          <View style={{ position: 'absolute', bottom: 56, left: 28, right: 28 }}>
            <Text style={{ color: 'rgba(0,0,0,0.35)', fontSize: 10, letterSpacing: 5, fontWeight: '700', marginBottom: 14 }}>
              CARBON NEUTRALITY
            </Text>
            <Text style={{ color: '#1A1A1A', fontSize: 46, fontWeight: '900', letterSpacing: -1.5, lineHeight: 50 }}>
              碳中{'\\n'}和时代
            </Text>
            <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: 14, lineHeight: 22, marginTop: 14 }}>
              2026 · 中国从能耗双控全面转向碳排放双控元年
            </Text>
          </View>
        </View>

        {/* ── 1: 碳排放双控 ── */}
        <RNAnimated.View style={{ paddingHorizontal: 28, paddingBottom: 60,
          transform: [{ translateY: sec1.y }, { scale: sec1.sx }], opacity: sec1.o }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 }}>
            <Text style={{ color: '#2D6A4F', fontSize: 80, fontWeight: '200', lineHeight: 80 }}>17%</Text>
            <View style={{ flex: 1, marginLeft: 12, paddingBottom: 8 }}>
              <Text style={{ color: 'rgba(0,0,0,0.4)', fontSize: 12, lineHeight: 18 }}>
                「十五五」期间{'\n'}单位GDP碳排放{'\n'}累计下降目标
              </Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(0,0,0,0.75)', fontSize: 15, lineHeight: 26, marginBottom: 8 }}>
            2026 年全国两会政府工作报告明确：年度单位 GDP 二氧化碳排放降低
          </Text>
          <Text style={{ color: '#2D6A4F', fontSize: 28, fontWeight: '800', marginBottom: 12 }}>3.8%</Text>
          <Text style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 24 }}>
            过去管「消耗了多少煤和电」，现在直接盯「排了多少二氧化碳」。企业使用风电、光伏等绿电不再计入碳排放考核。
          </Text>
        </RNAnimated.View>

        {/* ── 2: 能源革命 ── */}
        <RNAnimated.View style={{ transform: [{ translateY: sec2.y }, { scale: sec2.sx }], opacity: sec2.o }}>
          <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 8 }}>
            <Image source={require('../../assets/images/green/cat_energy.jpg')}
              style={{ width: SW - 40, height: 280 }} resizeMode="cover" />
          </View>
          <View style={{ paddingHorizontal: 28, paddingBottom: 56 }}>
            <Text style={{ color: 'rgba(0,0,0,0.35)', fontSize: 10, letterSpacing: 4, fontWeight: '700', marginTop: 20, marginBottom: 16 }}>
              ENERGY REVOLUTION
            </Text>
            <Text style={{ color: '#1A1A1A', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 }}>
              可再生能源装机占比突破 60%
            </Text>
            <Text style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 24, marginBottom: 24 }}>
              2025 年底可再生能源装机占全国电力总装机的 60.1%。光伏发电装机 12 亿千瓦，新型储能装机 1.36 亿千瓦。非化石能源新增发电量首次超过全社会新增用电量——达到 112.1%。
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ v: '60.1%', l: '可再生能源\n装机占比' }, { v: '12亿', l: '光伏装机\n容量(千瓦)' }, { v: '1.36亿', l: '新型储能\n装机(千瓦)' }].map((d, i) => (
                <View key={i} style={{ flex: 1, paddingVertical: 16, backgroundColor: '#E8EFE5', borderRadius: 18, alignItems: 'center' }}>
                  <Text style={{ color: '#2D6A4F', fontSize: 22, fontWeight: '800' }}>{d.v}</Text>
                  <Text style={{ color: 'rgba(0,0,0,0.4)', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 15 }}>{d.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </RNAnimated.View>

        {/* ── 3: 绿色经济 ── */}
        <RNAnimated.View style={{ transform: [{ translateY: sec3.y }, { scale: sec3.sx }], opacity: sec3.o }}>
          <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 8 }}>
            <Image source={require('../../assets/images/green/cat_waste.jpg')}
              style={{ width: SW - 40, height: 260 }} resizeMode="cover" />
          </View>
          <View style={{ paddingHorizontal: 28, paddingBottom: 56 }}>
            <Text style={{ color: 'rgba(0,0,0,0.35)', fontSize: 10, letterSpacing: 4, fontWeight: '700', marginTop: 20, marginBottom: 16 }}>
              GREEN ECONOMY
            </Text>
            <Text style={{ color: '#1A1A1A', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 }}>
              零碳园区与国家低碳转型基金
            </Text>
            <Text style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 24, marginBottom: 24 }}>
              政府工作报告首次写入「设立国家低碳转型基金」。首批 52 个国家级零碳园区已发布，预计产值 3.54 万亿元。2000 亿元超长期特别国债支持设备更新和绿色转型。
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['零碳园区', '低碳转型基金', '零碳工厂', '扩大绿电应用', '新型储能', '绿色燃料'].map((t) => (
                <View key={t} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E8EFE5',
                  borderRadius: 12, borderWidth: 1, borderColor: 'rgba(45,106,79,0.1)' }}>
                  <Text style={{ color: '#2D6A4F', fontSize: 11, fontWeight: '600' }}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </RNAnimated.View>

        {/* ── 4: 投资未来 ── */}
        <RNAnimated.View style={{ transform: [{ translateY: sec4.y }, { scale: sec4.sx }], opacity: sec4.o }}>
          <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 8 }}>
            <Image source={require('../../assets/images/green/cat_nature.jpg')}
              style={{ width: SW - 40, height: 300 }} resizeMode="cover" />
          </View>
          <View style={{ paddingHorizontal: 28, paddingBottom: 64 }}>
            <Text style={{ color: 'rgba(0,0,0,0.35)', fontSize: 10, letterSpacing: 4, fontWeight: '700', marginTop: 20, marginBottom: 16 }}>
              THE FUTURE
            </Text>
            <Text style={{ color: '#1A1A1A', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 }}>
              139 万亿的绿色投资蓝图
            </Text>
            <Text style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 24, marginBottom: 28 }}>
              据国家应对气候变化战略研究和国际合作中心测算，为实现 2060 年碳中和目标，中国新增气候领域投资需求约 139 万亿元，年均约 3.5 万亿元。氢能、绿色燃料、核聚变被列入「未来能源」培育名单。
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ v: '139', u: '万亿', l: '2060碳中和\n总投资需求' }, { v: '3.5', u: '万亿/年', l: '年均绿色\n投资规模' }, { v: '52', u: '个', l: '国家级\n零碳园区' }].map((d, i) => (
                <View key={i} style={{ flex: 1, paddingVertical: 16, backgroundColor: '#E8EFE5', borderRadius: 18, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ color: '#2D6A4F', fontSize: 26, fontWeight: '900' }}>{d.v}</Text>
                    <Text style={{ color: 'rgba(45,106,79,0.4)', fontSize: 11, marginLeft: 2 }}>{d.u}</Text>
                  </View>
                  <Text style={{ color: 'rgba(0,0,0,0.4)', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 15 }}>{d.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </RNAnimated.View>

        {/* ── CTA ── */}
        <RNAnimated.View style={{ transform: [{ translateY: cta.y }, { scale: cta.sx }], opacity: cta.o,
          marginHorizontal: 28, marginBottom: 40 }}>
          <View style={{ backgroundColor: '#1B4332', borderRadius: 28, padding: 32 }}>
            <Ionicons name="school" size={30} color="#95D5B2" style={{ marginBottom: 18 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 }}>
              准备测试你的环保知识了吗？
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 22, marginBottom: 28 }}>
              了解完这些真实政策数据，来挑战生态环保趣味问答吧。
            </Text>
            <Pressable onPress={() => router.push('/quiz/15' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                paddingVertical: 16, backgroundColor: '#40916C', borderRadius: 16 }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>开始答题</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 10 }} />
            </Pressable>
          </View>
        </RNAnimated.View>

      </ScrollView>
    </View>
  );
}
