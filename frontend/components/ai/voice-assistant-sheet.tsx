import { Ionicons } from '@expo/vector-icons';
import { useRef, useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useVoiceAssistant } from '@/stores/voice-assistant';

const MD_STYLES = StyleSheet.create({
  body: { color: '#222', fontSize: 14, lineHeight: 22 },
  heading3: { fontSize: 14, fontWeight: '700', color: '#6D28D9', marginTop: 6, marginBottom: 2 },
  strong: { fontWeight: '700', color: '#111' },
  bullet_list: { marginVertical: 1 },
  list_item: { marginVertical: 1 },
  blockquote: {
    backgroundColor: '#F5F3FF', borderLeftColor: '#7C3AED', borderLeftWidth: 3,
    paddingHorizontal: 10, paddingVertical: 4, marginVertical: 4,
  },
  link: { color: '#7C3AED' },
});

/** 从 AI 文字中判断是否为纯 JSON 指令（不应渲染 markdown） */
function isCommandOnly(text: string): boolean {
  return /^\s*\{[\s\n]*"command"\s*:/.test(text);
}

export function VoiceAssistantSheet() {
  const { messages, listening, transcript, hide } = useVoiceAssistant();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [messages, transcript]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 点击空白退出 */}
      <Pressable style={StyleSheet.absoluteFill} onPress={hide} />

      {/* 对话气泡 */}
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
                    <Ionicons name="sparkles" size={12} color="#7C3AED" />
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
              <View style={[styles.dot, { backgroundColor: '#A855F7', opacity: 0.8 }]} />
              <View style={[styles.dot, { backgroundColor: '#7C3AED', opacity: 1 }]} />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubblesWrap: {
    position: 'absolute', bottom: 180, left: 12, right: 12, maxHeight: 350,
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
    backgroundColor: '#7C3AED', borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderBottomLeftRadius: 14, borderBottomRightRadius: 3,
  },
  bubbleAI: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 14,
  },
  bubbleCmd: {
    backgroundColor: '#F5F3FF', borderLeftWidth: 3, borderLeftColor: '#7C3AED',
    borderTopLeftRadius: 3, borderTopRightRadius: 14, borderBottomLeftRadius: 3, borderBottomRightRadius: 14,
  },
  avatar: { marginRight: 6, marginTop: 2 },
  text: { fontSize: 14, lineHeight: 20 },
  textUser: { color: '#FFFFFF' },
  textAI: { color: '#2D2D2D' },
  textCmd: { color: '#5B21B6', fontWeight: '500' },
  listening: { alignSelf: 'center', flexDirection: 'row', gap: 5, padding: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C4B5FD', opacity: 0.6 },
});
