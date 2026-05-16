from PIL import Image, ImageDraw
import random

# Create a canvas
img = Image.new('RGB', (400, 400), (255, 255, 255))
draw = ImageDraw.Draw(img)

# Potato shape (brownish oval)
# Colors: Browns, tans
potato_color = (165, 124, 82)
secondary_color = (139, 69, 19)

# Main body
draw.ellipse([100, 150, 300, 250], fill=potato_color)
draw.ellipse([120, 130, 280, 270], fill=potato_color)

# Add some "eyes" (spots)
for _ in range(15):
    x = random.randint(110, 290)
    y = random.randint(140, 260)
    size = random.randint(2, 6)
    draw.ellipse([x, y, x+size, y+size], fill=secondary_color)

# Save the result
img.save('output/potato.png')
