import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Settings
width, height = 1024, 1024
bg_color = (0, 0, 50) # Deep Navy
gold_color = (255, 215, 0) # Gold
white_color = (255, 255, 255)
error_color = (255, 50, 50)

img = Image.new('RGB', (width, height), bg_color)
draw = ImageDraw.Draw(img)

# 1. Add Golden Noise/Veins
for _ in range(100):
    x1 = random.randint(0, width)
    y1 = random.randint(0, height)
    x2 = x1 + random.randint(-100, 100)
    y2 = y1 + random.randint(-100, 100)
    draw.line([x1, y1, x2, y2], fill=gold_color, width=random.randint(1, 5))

# 2. Add Fragmented Text
texts = ["RITSU", "404", "REQUIRE", "IMPORT", "VOID", "S A T U R A T E D", "G O L D", "F R A C T U R E D"]
for _ in range(40):
    txt = random.choice(texts)
    x = random.randint(0, width)
    y = random.randint(0, height)
    # Simulate a basic font-like look since I can't easily load custom fonts without paths
    # We'll just draw small blocks or use default
    draw.text((x, y), txt, fill=random.choice([gold_color, white_color, error_color]))

# 3. Frame Shifting (Glitch)
for _ in range(15):
    y_start = random.randint(0, height - 50)
    y_end = y_start + random.randint(10, 100)
    shift = random.randint(-50, 50)
    region = img.crop((0, y_start, width, y_end))
    img.paste(region, (shift, y_start))

# 4. Final Saturated Glow
img = img.filter(ImageFilter.GaussianBlur(radius=1))
img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=200, threshold=3))

img.save('output/ritsu_fragment.png')
print("Generated output/ritsu_fragment.png")
