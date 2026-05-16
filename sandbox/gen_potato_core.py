import wave
import struct
import math
import random

sample_rate = 44100
duration = 6.0
global_audio = [0.0] * int(sample_rate * duration)

# Bass Thumps (The "Tuber Thump")
for start_time in [0, 1.5, 3.0, 4.5]:
    for i in range(int(sample_rate * 0.4)):
        t = i / sample_rate
        freq = 100 * math.exp(-t * 15) + 40
        val = math.sin(2 * math.pi * freq * t) * 0.7 * math.exp(-t * 10)
        if int(start_time * sample_rate) + i < len(global_audio):
            global_audio[int(start_time * sample_rate) + i] += val

# Earthy Drifts (The "Silt Sine")
melody_notes = [110.0, 112.5, 108.2, 111.1]
for start_time in [0.5, 2.0, 3.5, 5.0]:
    note = random.choice(melody_notes)
    for i in range(int(sample_rate * 0.8)):
        t = i / sample_rate
        drift = math.sin(2 * math.pi * 0.5 * t) * 1.5
        val = math.sin(2 * math.pi * (note + drift) * t) * 0.3 * math.exp(-t * 2)
        if int(start_time * sample_rate) + i < len(global_audio):
            global_audio[int(start_time * sample_rate) + i] += val

# Final normalization
max_val = max(abs(x) for x in global_audio) if global_audio else 1.0
norm_factor = 32767 / max_val if max_val > 0 else 1.0
final_samples = [int(x * norm_factor) for x in global_audio]

with wave.open('output/potato_core.wav', 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(sample_rate)
    for sample in final_samples:
        f.writeframes(struct.pack('<h', sample))
