// 跨端语音识别封装。Web 走浏览器 Web Speech API，原生走 expo-speech-recognition。
// 返回识别结果文本（已加标点）。

import { Platform } from 'react-native';

let SpeechRecognitionNative: any = null;
try {
  if (Platform.OS !== 'web') {
    SpeechRecognitionNative = require('expo-speech-recognition');
  }
} catch {
  // 原生语音识别不可用时静默回退
}

export function isVoiceAvailable(): boolean {
  if (Platform.OS === 'web') {
    return !!((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
  }
  return !!SpeechRecognitionNative;
}

export interface VoiceCallbacks {
  onInterim?: (text: string) => void;  // 实时识别中间结果
}

export async function startListening(
  lang = 'zh-CN',
  callbacks?: VoiceCallbacks,
): Promise<string> {
  if (Platform.OS === 'web') {
    return webSpeechRecognition(lang, callbacks);
  }
  return nativeSpeechRecognition(lang);
}

// Web: 使用浏览器 Web Speech API
function webSpeechRecognition(lang: string, callbacks?: VoiceCallbacks): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error('浏览器不支持语音识别'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;  // 开启中间结果，实现实时显示
    recognition.maxAlternatives = 1;
    recognition.continuous = false;  // 单次识别，说完自动停

    let finalTranscript = '';
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      // 推送实时中间结果
      if (callbacks?.onInterim) {
        callbacks.onInterim(finalTranscript + interim);
      }
      // 收到 final 后开始静默计时
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };

    recognition.onend = () => {
      resolve(finalTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      // "no-speech" / "aborted" 不算致命错误
      if (event.error === 'no-speech' || event.error === 'aborted') {
        resolve(finalTranscript.trim());
        return;
      }
      reject(new Error(`语音识别错误: ${event.error}`));
    };

    recognition.start();
  });
}

// 原生: 使用 expo-speech-recognition
async function nativeSpeechRecognition(lang: string): Promise<string> {
  if (!SpeechRecognitionNative) {
    throw new Error('原生语音识别不可用');
  }
  try {
    const result = await SpeechRecognitionNative.recognizeAsync({
      language: lang,
      partialResults: false,
    });
    return result?.transcript ?? '';
  } catch (e: any) {
    throw new Error(`语音识别失败: ${e.message}`);
  }
}
