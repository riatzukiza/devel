
import wave
import numpy as np

def generate_beat():
    sample_rate = 44100
    duration = 16.63
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    
    # 66Hz Hum
    hum = 0.3 * np.sin(2 * np.pi * 66 * t)
    
    # Kick (60Hz decaying sine)
    kick_freq = 60
    kick_duration = 0.1
    kick_samples = int(sample_rate * kick_duration)
    kick_wave = np.sin(2 * np.pi * kick_freq * np.linspace(0, kick_duration, kick_samples)) * np.exp(-np.linspace(0, 10, kick_samples))
    
    # Snare (Noise)
    snare_duration = 0.1
    snare_samples = int(sample_rate * snare_duration)
    snare_wave = np.random.uniform(-1, 1, snare_samples) * np.exp(-np.linspace(0, 10, snare_samples))
    
    # Pattern (160 BPM)
    # 1 beat = 60/160 = 0.375s
    beat_period = 0.375
    audio = hum.copy()
    
    for i in range(int(duration / beat_period)):
        start_sample = int(i * beat_period * sample_rate)
        # Kick on 1 and 3
        if i % 2 == 0:
            end = min(start_sample + kick_samples, len(audio))
            audio[start_sample:end] += kick_wave[:end-start_sample]
            
        # Snare on 2 and 4
        if i % 2 == 1:
            end = min(start_sample + snare_samples, len(audio))
            audio[start_sample:end] += snare_wave[:end-start_sample]
            
    # Normalize
    audio = audio / np.max(np.abs(audio))
    audio_int = (audio * 32767).astype(np.int16)
    
    with wave.open("sovereign_beat.wav", "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(audio_int.tobytes())

generate_beat()
