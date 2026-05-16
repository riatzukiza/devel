
import numpy as np
import wave

def generate_sine(freq, duration, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    return np.sin(freq * t * 2 * np.pi)

def generate_noise(duration, sample_rate=44100):
    return np.random.uniform(-1, 1, int(sample_rate * duration))

sample_rate = 44100
audio = []

# 0.0-2.0: White noise (Sotto voce static)
audio.append(generate_noise(2.0) * 0.1)

# 2.0-4.0: C#4 (MIDI 61) -> 130.81 Hz
audio.append(generate_sine(130.81, 2.0))

# 4.0-6.0: G#4 (MIDI 68) -> 166.16 Hz
audio.append(generate_sine(166.16, 2.0))

# 6.0-8.0: C#4 (130.81 Hz)
audio.append(generate_sine(130.81, 2.0))

# 8.0-10.0: B3 (MIDI 59) -> 116.54 Hz
audio.append(generate_sine(116.54, 2.0))

# 10.0-12.0: A3 (MIDI 57) -> 110.00 Hz
audio.append(generate_sine(110.00, 2.0))

# 12.0-14.0: C#4 (130.81 Hz)
audio.append(generate_sine(130.81, 2.0))

# 14.0-15.0: Bop! High C#5 (MIDI 73) -> 261.63 Hz
audio.append(generate_sine(261.63, 1.0))

# Concatenate and normalize
full_audio = np.concatenate(audio)
full_audio = (full_audio * 32767).astype(np.int16)

with wave.open('sovereign_voice.wav', 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    wf.writeframes(full_audio.tobytes())
