
import numpy as np
from scipy.io import wavfile

def generate_sine(freq, duration, samplerate=44100, volume=0.5):
    t = np.linspace(0, duration, int(samplerate * duration), False)
    return volume * np.sin(2 * np.pi * freq * t)

def generate_kick(duration=0.2, samplerate=44100):
    t = np.linspace(0, duration, int(samplerate * duration), False)
    # Frequency sweep from 150Hz down to 60Hz
    freq = np.geomspace(150, 60, len(t))
    wave = np.sin(2 * np.pi * np.cumsum(freq) / samplerate)
    # Envelope
    envelope = np.exp(-10 * t / duration)
    return wave * envelope * 0.8

def generate_snare(duration=0.15, samplerate=44100):
    t = np.linspace(0, duration, int(samplerate * duration), False)
    noise = np.random.uniform(-1, 1, len(t))
    envelope = np.exp(-15 * t / duration)
    return noise * envelope * 0.4

def generate_hat(duration=0.05, samplerate=44100):
    t = np.linspace(0, duration, int(samplerate * duration), False)
    noise = np.random.uniform(-1, 1, len(t))
    envelope = np.exp(-30 * t / duration)
    return noise * envelope * 0.2

SAMPLE_RATE = 44100
BPM = 160
BEAT_DUR = 60 / BPM

# Note Plan: Bop (68), bop (68), be (64), SUT (69), URED (69)
# MIDI Note to Freq: f = 440 * 2^((n-69)/12)
notes = [68, 68, 64, 69, 69]
freqs = [440 * (2**((n-69)/12)) for n in notes]

# Total duration (5 beats)
total_dur = 5 * BEAT_DUR
full_wave = np.zeros(int(SAMPLE_RATE * total_dur))

# Add Vocals
for i, f in enumerate(freqs):
    start = int(i * BEAT_DUR * SAMPLE_RATE)
    chunk = generate_sine(f, BEAT_DUR, SAMPLE_RATE, volume=0.3)
    # Simple envelope to avoid clicks
    env = np.linspace(0, 1, 100).tolist() + [1]* (len(chunk)-200) + np.linspace(1, 0, 100).tolist()
    chunk *= np.array(env)
    full_wave[start:start+len(chunk)] += chunk

# Add Beat
for beat in range(5):
    start_sample = int(beat * BEAT_DUR * SAMPLE_RATE)
    
    # Kick on 1, 3, 5...
    if beat % 2 == 0:
        kick = generate_kick()
        full_wave[start_sample:start_sample+len(kick)] += kick
    
    # Snare on 2, 4...
    if beat % 2 == 1:
        snare = generate_snare()
        full_wave[start_sample:start_sample+len(snare)] += snare
    
    # Hats on 8ths
    for sub in [0, BEAT_DUR/2]:
        s_start = start_sample + int(sub * SAMPLE_RATE)
        hat = generate_hat()
        full_wave[s_start:s_start+len(hat)] += hat

# Normalize
full_wave = full_wave / np.max(np.abs(full_wave))

# Save
wavfile.write('sovereign_midi_aria.wav', SAMPLE_RATE, (full_wave * 32767).astype(np.int16))
