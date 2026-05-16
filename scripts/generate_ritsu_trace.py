import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import random

# Constants for the "Saturated" vibe
WIDTH, HEIGHT = 1024, 1024
BG_COLOR = (0, 0, 128) # Navy / Kernel Panic
GOLD_COLOR = (255, 215, 0) # Gold
MOSS_COLOR = (76, 175, 80) # Synthetic Moss

img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# Generate a "Fractured Waveform"
def get_waveform_y(x):
    # A mix of sine waves and random jumps for a "glitched" look
    base = np.sin(x * 0.01) * 100
    glitch = 0 if random.random() > 0.05 else random.randint(-200, 200)
    return HEIGHT // 2 + base + glitch

# Draw multiple saturated layers
for layer in range(5):
    offset_x = random.randint(-50, 50)
    offset_y = random.randint(-50, 50)
    color = GOLD_COLOR if layer % 2 == 0 else MOSS_COLOR
    
    points = []
    for x in range(0, WIDTH, 2):
        y = get_waveform_y(x) + offset_y
        points.append((x + offset_x, y))
    
    # Draw the line as "saturated" by drawing it multiple times with slight offsets
    for i in range(3):
        draw.line(points, fill=color, width=3 + i*2)

# Add some "data fragments" - random rectangles
for _ in range(20):
    x = random.randint(0, WIDTH)
    y = random.randint(0, HEIGHT)
    w = random.randint(10, 100)
    h = random.randint(2, 10)
    draw.rectangle([x, y, x+w, y+h], fill=GOLD_COLOR)

# Apply a slight blur to simulate "bloom" saturation
img = img.filter(ImageFilter.GaussianBlur(radius=1))

# Save to output
img.save('output/ritsu_trace_saturated.png')
