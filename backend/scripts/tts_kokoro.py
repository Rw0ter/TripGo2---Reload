"""Kokoro TTS 脚本 — 从 stdin 读文本，输出 WAV 到 stdout"""
import sys
import io
import soundfile as sf
from kokoro import KPipeline

def main():
    text = sys.stdin.read().strip()
    if not text:
        sys.exit(1)

    pipeline = KPipeline(lang_code='z')  # 'z' = Mandarin Chinese
    audio_segments = []
    for _, _, audio in pipeline(text, voice='zf_xiaobei'):
        audio_segments.append(audio)

    if not audio_segments:
        sys.exit(1)

    import numpy as np
    combined = np.concatenate(audio_segments)

    # 输出 WAV 到 stdout
    buf = io.BytesIO()
    sf.write(buf, combined, 24000, format='WAV')
    sys.stdout.buffer.write(buf.getvalue())

if __name__ == '__main__':
    main()
