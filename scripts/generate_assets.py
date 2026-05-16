import numpy as np
from PIL import Image
import wave

# 1. Generate Saturated Waveform Image
width, height = 800, 400
img = Image.new('RGB', (width, height), (15, 15, 15))
pixels = img.load()

# Draw a "brick wall" waveform with some digital noise/glitch
for x in range(width):
    # Randomize the "clip" level slightly for a glitchy look
    clip_top = 120 + np.random.randint(-10, 10)
    clip_bottom = 280 + np.random.randint(-10, 10)
    
    # Golden/Yellow "Starch" colors
    color = (255, 215, 0) if np.random.random() > 0.2 else (255, 255, 180)
    
    for y in range(clip_top, clip_bottom):
        if np.random.random() > 0.05: # add some holes/noise
            pixels[x, y] = color

# Add some "UI" elements to make it look like a DAW
for x in range(width):
    pixels[x, 0] = (50, 50, 50)
    pixels[x, height-1] = (50, 50, 50)
for y in range(height):
    pixels[0, y] = (50, 50, 50)
    pixels[width-1, y] = (50, 50, 50)

img.save('output/saturated_waveform_v2.png')

# 2. Generate Saturated "Crunch" Audio
sample_rate = 44100
duration = 1.0
t = np.linspace(0, duration, int(sample_rate * duration))
# Create a mix of a low square wave and high-frequency noise for "crunch"
square = np.sign(np.sin(2 * np.pi * 60 * t)) # Low rumble
noise = np.random.uniform(-1, 1, len(t))
combined = (square * 0.7 + noise * 0.3)
# Hard clip it aggressively
combined = np.clip(combined * 5, -1, 1)
data = (combined * 32767).astype(np.int16)

with wave.open('output/saturated_crunch.wav', 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(sample_rate)
    f.writeframes(data.tobytes())

print("Assets generated successfully.")
