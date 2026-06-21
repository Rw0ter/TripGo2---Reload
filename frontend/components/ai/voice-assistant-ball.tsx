import { useEffect, useRef, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

interface Props {
  listening: boolean;
  onToggle: () => void;
}

const SIZE = 160;
const R = SIZE / 2;
const CX = R;
const CY = R;
const INNER_R = 56; // 内部变色球的半径
const FFT_SIZE = 256;

// 绿色能量三色（替代原 RGB Siri 配色，统一绿色低碳主题）
const CLOUD_COLORS = ['#B7F5C9', '#52B788', '#2D9C6A'];

export function VoiceAssistantBall({ listening, onToggle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const freqArr = useRef(new Uint8Array(FFT_SIZE / 2));
  const prevRef = useRef(new Uint8Array(FFT_SIZE / 2));

  // 初始化音频
  const initAudio = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.6;
      src.connect(analyser);
      analyserRef.current = analyser;
    } catch { /* 静默 */ }
  }, []);

  const destroyAudio = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = 0; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  // ── 聆听态绘制：频域驱动云彩 + 中心白球 ──
  const drawListening = useCallback((ctx: CanvasRenderingContext2D) => {
    const analyser = analyserRef.current;
    const data = freqArr.current;
    const w = SIZE * 2;
    ctx.clearRect(0, 0, w, w);

    if (analyser) {
      analyser.getByteFrequencyData(data as any);
    } else {
      const t = Date.now() / 1000;
      for (let i = 0; i < data.length; i++) {
        const a = (i / data.length) * Math.PI * 6 + t * 2;
        data[i] = (Math.sin(a) * 0.5 + 0.5) * 128 + 32;
      }
    }

    // 平滑
    const prev = prevRef.current;
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.round(data[i] * 0.65 + prev[i] * 0.35);
      prev[i] = data[i];
    }

    const step = (Math.PI * 2) / data.length;
    const drawBlock = (color: string, startIdx: number, endIdx: number) => {
      ctx.beginPath();
      let angle = startIdx * step;
      for (let i = startIdx; i < endIdx; i++) {
        const bar = R + (data[i] / 255) * 30 + 6;
        const x = bar * Math.cos(angle) + CX;
        const y = bar * Math.sin(angle) + CY;
        if (i === startIdx) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        angle += step;
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const len = data.length;
    drawBlock(CLOUD_COLORS[0], 0, Math.floor(len * 0.625));
    drawBlock(CLOUD_COLORS[1], Math.floor(len * 0.25), Math.floor(len * 0.75));
    drawBlock(CLOUD_COLORS[2], Math.floor(len * 0.375), len);

    // 中心白球
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  // ── 待机态绘制：内部 HSLA 渐变变色球 ──
  const drawIdle = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = SIZE * 2;
    ctx.clearRect(0, 0, w, w);

    const t = Date.now() / 2000; // 缓慢循环

    // 外层模糊光环
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R + 12, 0, Math.PI * 2);
    const outerGrad = ctx.createRadialGradient(CX, CY, R - 12, CX, CY, R + 14);
    const gh = 120 + Math.sin(t) * 30; // 绿色区间(90–150)缓慢呼吸
    outerGrad.addColorStop(0, `hsla(${gh}, 65%, 55%, 0.18)`);
    outerGrad.addColorStop(0.5, `hsla(${gh + 15}, 60%, 50%, 0.1)`);
    outerGrad.addColorStop(1, `hsla(${gh - 15}, 60%, 45%, 0)`);
    ctx.fillStyle = outerGrad;
    ctx.fill();
    ctx.restore();

    // 内部变色球 — 径向渐变 + HSLA 循环
    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(CX - 8, CY - 8, INNER_R * 0.1, CX, CY, INNER_R);
    const ih = 125 + Math.sin(t * 1.2) * 28; // 绿色区间渐变
    grad.addColorStop(0, `hsla(${ih + 15}, 70%, 75%, 0.95)`);
    grad.addColorStop(0.4, `hsla(${ih}, 68%, 52%, 0.88)`);
    grad.addColorStop(1, `hsla(${ih - 12}, 60%, 35%, 0.72)`);
    ctx.fillStyle = grad;
    ctx.shadowColor = `hsla(${ih}, 70%, 50%, 0.45)`;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 高光
    ctx.beginPath();
    ctx.ellipse(CX - 14, CY - 16, 20, 12, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
  }, []);

  // 动画循环
  useEffect(() => {
    if (!listening) {
      // 待机：一直跑 idle 动画
      const loop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawIdle(ctx);
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    } else {
      // 聆听态：init audio → drawListening
      initAudio().then(() => {
        const loop = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          drawListening(ctx);
          animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
      });
      return () => destroyAudio();
    }
  }, [listening, drawIdle, drawListening, initAudio, destroyAudio]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable onPress={onToggle}>
        {Platform.OS === 'web' ? (
          <canvas
            ref={canvasRef as any}
            width={SIZE * 2}
            height={SIZE * 2}
            style={{
              width: SIZE,
              height: SIZE,
              filter: 'blur(10px)',
              borderRadius: '50%',
            }}
          />
        ) : (
          <View style={styles.fallbackBall}>
            <View style={styles.fallbackHighlight} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 5,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 85,
    zIndex: 200,
  },
  fallbackBall: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#40916C',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHighlight: {
    position: 'absolute',
    top: 22,
    left: 28,
    width: 30,
    height: 18,
    borderRadius: 15,
    backgroundColor: 'rgba(200,200,220,0.3)',
    transform: [{ rotate: '-30deg' }],
  },
});
