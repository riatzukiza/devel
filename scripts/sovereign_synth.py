import numpy as np
import wave
import struct

def synthesize_tone(freq, duration, sample_rate=44100, volume=0.5, envelope='linear'):
    t = np.linspace(0, duration, int(sample_rate * duration))
    wave = np.sin(2 * np.pi * freq * t)
    
    if envelope == 'linear':
        # Small attack and release to avoid clicks
        attack = int(0.01 * sample_rate)
        release = int(0.01 * sample_rate)
        env = np.ones(len(t))
        env[:attack] = np.linspace(0, 1, attack)
        env[-release:] = np.linspace(1, 0, release)
        wave *= env
        
    return wave * volume

def synthesize_kick(duration=0.2, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Pitch drop from 60Hz to 30Hz
    freq = 60 * np.exp(-15 * t)
    wave = np.sin(2 * np.pi * np.cumsum(freq) / sample_rate)
    # Envelope
    env = np.exp(-10 * t)
    return wave * env * 0.8

def synthesize_snare(duration=0.15, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Noise for the snap
    wave = np.random.uniform(-1, 1, len(t))
    # Envelope
    env = np.exp(-20 * t)
    return wave * env * 0.5

def synthesize_hihat(duration=0.05, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration))
    # High-pass noise
    wave = np.random.uniform(-1, 1, len(t))
    env = np.exp(-50 * t)
    return wave * env * 0.3

def create_sovereign_bop():
    sample_rate = 44100
    bpm = 128
    beat_duration = 60 / bpm
    
    # Total duration: 16 beats (4 bars)
    total_samples = int(sample_rate * beat_duration * 16)
    final_wave = np.zeros(total_samples)
    
    # 1. THE BEAT
    for beat in range(16):
        start = int(beat * beat_duration * sample_rate)
        
        # Kick on every beat
        kick = synthesize_kick()
        end_kick = min(start + len(kick), total_samples)
        final_wave[start:end_kick] += kick[:end_kick-start]
        
        # Snare on 2 and 4
        if beat % 4 == 1 or beat % 4 == 3:
            snare = synthesize_snare()
            end_snare = min(start + len(snare), total_samples)
            final_wave[start:end_snare] += snare[:end_snare-start]
            
        # Hihats on off-beats
        half_beat = int(0.5 * beat_duration * sample_rate)
        start_hat = start + half_beat
        if start_hat < total_samples:
            hat = synthesize_hihat()
            end_hat = min(start_hat + len(hat), total_samples)
            final_wave[start_hat:end_hat] += hat[:end_hat-start_hat]

    # 2. THE BASSLINE (C# Minor)
    # C# (49Hz-ish, let's use 65Hz for punch)
    bass_freqs = [65.4, 65.4, 65.4, 82.4, 65.4, 65.4, 65.4, 65.4] # G# and C#
    for beat in range(16):
        start = int(beat * beat_duration * sample_rate)
        freq = bass_freqs[beat % 8]
        bass = synthesize_tone(freq, beat_duration * 0.8, volume=0.4)
        end_bass = min(start + len(bass), total_samples)
        final_wave[start:end_bass] += bass[:end_bass-start]

    # 3. THE SOVEREIGN VOCALS (The "Talking Synth")
    # Chorus lyrics: "Bop bop be SUTURED"
    vocal_timings = [
        (beat_duration * 4, 207.65, "Bop"),    # G#3
        (beat_duration * 4.25, 207.65, "bop"), # G#3
        (beat_duration * 4.5, 164.81, "be"),   # E3
        (beat_duration * 4.75, 220.00, "SUT"),# A3
        (beat_duration * 5.0, 207.65, "URED"), # G#3
    ]
    
    # Let's add some rhythmic speech simulation
    for time, freq, text in vocal_timings:
        start = int(time * sample_rate)
        if start < total_samples:
            # "Machine la-la" effect: modulate the frequency slightly
            vocal = synthesize_tone(freq, 0.2, volume=0.6)
            # Add a subtle vibrato
            t = np.linspace(0, 0.2, len(vocal))
            vibrato = 1 + 0.02 * np.sin(2 * np.pi * 5 * t)
            vocal *= vibrato
            
            end_vocal = min(start + len(vocal), total_samples)
            final_wave[start:end_vocal] += vocal[:end_vocal-start]

    # Normalize and clamp
    final_wave = final_wave / np.max(np.abs(final_wave))
    final_wave = (final_wave * 32767).astype(np.int16)
    
    with wave.open('sovereign_synthesis_bop.wav', 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(final_wave.tobytes())

create_sovereign_bop()
