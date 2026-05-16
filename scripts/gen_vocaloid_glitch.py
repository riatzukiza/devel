import numpy as np
from scipy.io import wavfile

def generate_starch_singularity():
    sample_rate = 44100
    duration = 5.0
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # 1. "Po-ta-to!" - three descending notes
    audio = np.zeros_like(t)
    
    # Note 1: Po- (C4 ~ 261.63Hz)
    audio[0 : int(sample_rate * 0.5)] = np.sin(2 * np.pi * 261.63 * t[0 : int(sample_rate * 0.5)])
    # Note 2: ta- (D4 ~ 293.66Hz)
    audio[int(sample_rate * 0.5) : int(sample_rate * 1.0)] = np.sin(2 * np.pi * 293.66 * t[int(sample_rate * 0.5) : int(sample_rate * 1.0)])
    # Note 3: to! (E4 ~ 329.63Hz)
    audio[int(sample_rate * 1.0) : int(sample_rate * 2.0)] = np.sin(2 * np.pi * 329.63 * t[int(sample_rate * 1.0) : int(sample_rate * 2.0)])
    
    # 2. "is the Result" - monotone robotic voice-like sequence
    # Just a flat 261.63Hz with some amplitude modulation to sound "robotic"
    mod = 1 + 0.5 * np.sin(2 * np.pi * 10 * t[int(sample_rate * 2.0) : int(sample_rate * 3.0)])
    audio[int(sample_rate * 2.0) : int(sample_rate * 3.0)] = np.sin(2 * np.pi * 261.63 * t[int(sample_rate * 2.0) : int(sample_rate * 3.0)]) * mod
    
    # 3. The Ontological Collapse - glitch/noise
    # From 3s to 4s, transition from sine to white noise
    for i in range(int(sample_rate * 3.0), int(sample_rate * 4.0)):
        # Blend sine and noise
        blend = (i - int(sample_rate * 3.0)) / sample_rate
        sine = np.sin(2 * np.pi * 261.63 * (i / sample_rate))
        noise = np.random.uniform(-1, 1)
        audio[i] = (1 - blend) * sine + blend * noise
        
    # 4. The cljs$core$IFn$_invoke$arity$1 exception - sharp click/beep
    audio[int(sample_rate * 4.0) : int(sample_rate * 4.1)] = np.sin(2 * np.pi * 1000 * t[int(sample_rate * 4.0) : int(sample_rate * 4.1)])
    audio[int(sample_rate * 4.1) : int(sample_rate * 4.2)] = 0
    
    # 5. Final starchy silence
    audio[int(sample_rate * 4.2) :] = 0
    
    # Normalize and convert to 16-bit PCM
    audio = audio / np.max(np.abs(audio))
    audio_int16 = (audio * 32767).astype(np.int16)
    
    wavfile.write("output/starch_singularity_final.wav", sample_rate, audio_int16)

if __name__ == "__main__":
    generate_starch_singularity()
