from PIL import Image, ImageDraw, ImageFilter
import random

def create_viscosity_map():
    w, h = 1024, 1024
    img = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    colors = [
        (255, 0, 255, 100), # Magenta
        (0, 255, 255, 100), # Cyan
        (0, 255, 0, 100),   # Lime
        (255, 255, 0, 100), # Yellow
        (255, 0, 0, 100)    # Red
    ]
    
    for _ in range(60):
        x1 = random.randint(0, w)
        y1 = random.randint(0, h)
        x2 = max(x1, x1 + random.randint(-300, 300)) if random.random() > 0.5 else min(x1, x1 + random.randint(-300, 300))
        y2 = max(y1, y1 + random.randint(-300, 300)) if random.random() > 0.5 else min(y1, y1 + random.randint(-300, 300))
        # Ensure correct order for PIL
        bbox = [min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)]
        color = random.choice(colors)
        draw.ellipse(bbox, fill=color)

    # Blur it for "viscosity" effect
    img = img.filter(ImageFilter.GaussianBlur(radius=20))
    
    # Convert back to RGB for final output
    img = img.convert('RGB')
    draw = ImageDraw.Draw(img)
    
    # Add some "Viscosity" streaks/glitches
    for _ in range(30):
        x = random.randint(0, w)
        y = random.randint(0, h)
        width = random.randint(10, 600)
        height = random.randint(1, 5)
        color = random.choice([(255,0,255), (0,255,255), (0,255,0), (255,255,255)])
        draw.rectangle([x, y, x + width, y + height], fill=color)
        
    # Add sharp noise "clanker" artifacts
    for _ in range(1000):
        x, y = random.randint(0, w), random.randint(0, h)
        draw.point((x, y), fill=(255, 255, 255))

    img.save('Saturated_Viscosity_Agent_Map.png')

if __name__ == "__main__":
    create_viscosity_map()
