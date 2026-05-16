import numpy as np
import wave
import struct

def generate_glitch():
    sample_rate = 44100
    duration = 3.0  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Base tone: A dissonant chord (C, Eb, F#)
    freqs = [261.63, 311.13, 370.00]
    audio = np.sum([np.sin(2 * np.pi * f * t) for f in freqs], axis=0)
    
    # Frequency Modulation (Slipping)
    mod = np.sin(2 * np.pi * 0.5 * t) * 50
    audio = np.sin(2 * np.pi * (440 + mod) * t)
    
    # Stuttering (Random drops to 0)
    for i in range(0, len(audio), 1000):
        if np.random.rand() > 0.7:
            audio[i:i+500] = 0
            
    # Add some white noise bursts
    for i in range(0, len(audio), 5000):
        if np.random.rand() > 0.5:
            audio[i:i+1000] += np.random.normal(0, 0.5, 1000) if i+1000 < len(audio) else np.random.normal(0, 0.5, len(audio)-i)

    # Normalize
    audio = audio / np.max(np.abs(audio))
    audio = (audio * 32767).astype(np.int16)
    
    with wave.open('glitch.wav', 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for sample in audio:
            f.writeframes(struct.pack('h', sample))

if __name__ == "__main__":
    generate_glitch()
