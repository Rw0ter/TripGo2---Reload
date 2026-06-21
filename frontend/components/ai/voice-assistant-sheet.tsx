import { Ionicons } from '@expo/vector-icons';
import { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useVoiceAssistant } from '@/stores/voice-assistant';

const MD_STYLES = StyleSheet.create({
  body: { color: '#222', fontSize: 14, lineHeight: 22 },
  heading3: { fontSize: 14, fontWeight: '700', color: '#2D6A4F', marginTop: 6, marginBottom: 2 },
  strong: { fontWeight: '700', color: '#111' },
  bullet_list: { marginVertical: 1 },
  list_item: { marginVertical: 1 },
  blockquote: {
    backgroundColor: '#EAF7EF', borderLeftColor: '#40916C', borderLeftWidth: 3,
    paddingHorizontal: 10, paddingVertical: 4, marginVertical: 4,
  },
  link: { color: '#40916C' },
});

/** 从 AI 文字中判断是否为纯 JSON 指令（不应渲染 markdown） */
function isCommandOnly(text: string): boolean {
  return /^\s*\{[\s\n]*"command"\s*:/.test(text);
}

export function VoiceAssistantSheet() {
  const { messages, listening, transcript } = useVoiceAssistant();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [messages, transcript]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 对话气泡：box-none —— 气泡区内可滚动查看多轮历史，区外空白处点击穿透到下层页面 */}
      <View style={styles.bubblesWrap} pointerEvents="box-none">
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, i) => (
            <View key={i} style={[styles.row, msg.role === 'user' ? styles.rowUser : styles.rowAI]}>
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : msg.isCommand ? styles.bubbleCmd : styles.bubbleAI,
                ]}
              >
                {msg.role === 'assistant' && (
                  <View style={styles.avatar}>
                    <Ionicons name="sparkles" size={12} color="#40916C" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  {msg.role === 'assistant' && !msg.isCommand && !isCommandOnly(msg.text) ? (
                    <Markdown style={MD_STYLES}>{msg.text}</Markdown>
                  ) : (
                    <Text style={[
                      styles.text,
                      msg.role === 'user' ? styles.textUser : msg.isCommand ? styles.textCmd : styles.textAI,
                    ]}>
                      {msg.text}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* 聆听时实时文字 */}
          {listening && transcript ? (
            <View style={[styles.row, styles.rowUser]}>
              <View style={[styles.bubble, styles.bubbleUser]}>
                <Text style={[styles.text, styles.textUser]}>
                  {transcript}...
                </Text>
              </View>
            </View>
          ) : null}

          {/* 聆听指示器 */}
          {listening && !transcript && (
            <View style={styles.listening}>
              <View style={styles.dot} />
              <View style={[styles.dot, { backgroundColor: '#52B788', opacity: 0.8 }]} />
              <View style={[styles.dot, { backgroundColor: '#40916C', opacity: 1 }]} />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubblesWrap: {
    position: 'absolute', bottom: 170, left: 12, right: 12, maxHeight: 420,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: 8, paddingHorizontal: 4 },
  row: { flexDirection: 'row' },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  bubble: {
    flexDirection: 'row', padding: 12, maxWidth: '88%',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#40916C', borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderBottomLeftRadius: 14, borderBottomRightRadius: 3,
  },
  bubbleAI: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 14,
  },
  bubbleCmd: {
    backgroundColor: '#EAF7EF', borderLeftWidth: 3, borderLeftColor: '#40916C',
    borderTopLeftRadius: 3, borderTopRightRadius: 14, borderBottomLeftRadius: 3, borderBottomRightRadius: 14,
  },
  avatar: { marginRight: 6, marginTop: 2 },
  text: { fontSize: 14, lineHeight: 20 },
  textUser: { color: '#FFFFFF' },
  textAI: { color: '#2D2D2D' },
  textCmd: { color: '#2D6A4F', fontWeight: '500' },
  listening: { alignSelf: 'center', flexDirection: 'row', gap: 5, padding: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#95D5B2', opacity: 0.6 },
});
