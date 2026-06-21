import { create } from 'zustand';

export interface VAMessage {
  role: 'user' | 'assistant';
  text: string;
  isCommand?: boolean;
}

interface VoiceAssistantState {
  visible: boolean;
  listening: boolean;
  messages: VAMessage[];
  transcript: string;
  show: () => void;
  hide: () => void;
  reset: () => void;
  setListening: (v: boolean) => void;
  setTranscript: (t: string) => void;
  addMessage: (msg: VAMessage) => void;
  clearTranscript: () => void;
}

export const useVoiceAssistant = create<VoiceAssistantState>((set) => ({
  visible: false,
  listening: false,
  messages: [],
  transcript: '',
  // 打开助手：不清除历史，保持连续对话
  show: () => set({ visible: true, transcript: '' }),
  // 关闭助手：只隐藏 UI，保留 messages 以便下次继续
  hide: () => set({ visible: false, listening: false, transcript: '' }),
  // 手动重置：开始全新的对话
  reset: () => set({ messages: [], transcript: '' }),
  setListening: (v) => set({ listening: v }),
  setTranscript: (t) => set({ transcript: t }),
  addMessage: (msg) => set((s) => {
    const next = [...s.messages, msg];
    if (next.length > 120) next.splice(0, next.length - 100); // 保持最近 100 条
    return { messages: next };
  }),
  clearTranscript: () => set({ transcript: '' }),
}));
