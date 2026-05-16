from PIL import Image, ImageDraw, ImageFont

# Settings
width, height = 1080, 1080
bg_color = (245, 245, 245) # Off-white
accent_color = (0, 0, 0)    # Black
shadow_color = (200, 200, 200, 128) # Grey with Alpha

# Create image
img = Image.new('RGBA', (width, height), bg_color)
draw = ImageDraw.Draw(img)

# Draw the "Shadow" (The perceived expectation)
shadow_size = 600
shadow_x = (width - shadow_size) // 2
shadow_y = 100
shadow_shape = [shadow_x, shadow_y, shadow_x + shadow_size, shadow_y + shadow_size]
draw.ellipse(shadow_shape, fill=(200, 200, 200, 100))

# Draw the "Self" (The actual person)
self_size = 40
self_x = (width - self_size) // 2
self_y = height - 300
self_shape = [self_x, self_y, self_x + self_size, self_y + self_size]
draw.ellipse(self_shape, fill=accent_color)

# Text
try:
    # Try to load a font, otherwise use default
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
except:
    font = ImageFont.load_default()

text = "the imposter syndrome never gets easier."
# Calculate text width/height for centering
# Using a simple estimation since textbbox might not be in all PIL versions
text_bbox = draw.textbbox((0, 0), text, font=font)
text_width = text_bbox[2] - text_bbox[0]
text_x = (width - text_width) // 2
text_y = height - 200
draw.text((text_x, text_y), text, fill=accent_color, font=font)

# Save as PNG
img = img.convert('RGB')
img.save('imposter_syndrome_minimal.png')
