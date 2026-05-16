import wave
import numpy as np

sample_rate = 44100
duration = 0.429
silence = np.zeros(int(sample_rate * duration))
beep = np.sin(2 * np.pi * 880 * np.linspace(0, duration, int(sample_rate * duration)))
glitch = np.random.uniform(-1, 1, int(sample_rate * duration)) * 0.1 + beep

audio = np.concatenate([silence, glitch, silence, glitch])
audio = (audio * 32767).astype(np.int16)

with wave.open('sovereign_429.wav', 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(sample_rate)
    f.writeframes(audio.tobytes())
