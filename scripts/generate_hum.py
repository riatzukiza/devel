import numpy as np
import wave
import struct

sample_rate = 44100
duration = 3.0
frequency = 66.0

t = np.linspace(0, duration, int(sample_rate * duration), False)
tone = np.sin(frequency * t * 2 * np.pi)
audio = (tone * 32767).astype(np.int16)

with wave.open('sovereign_recovery_hum.wav', 'w') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(sample_rate)
    f.writeframes(audio.tobytes())
