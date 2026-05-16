import wave
import numpy as np

def generate_sine_wave(freq, duration, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    return np.sin(2 * np.pi * freq * t)

sample_rate = 44100
duration_per_note = 0.5
notes = [261.63, 329.63, 392.00, 523.25] # C4, E4, G4, C5

audio = np.concatenate([generate_sine_wave(f, duration_per_note) for f in notes])
audio = (audio * 32767).astype(np.int16)

with wave.open('dry_beeps.wav', 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(sample_rate)
    f.writeframes(audio.tobytes())
