from PIL import Image, ImageDraw, ImageFont

# Settings
width, height = 800, 400
bg_color = (10, 10, 10)  # Void Black
plt_color = (229, 228, 226)  # Platinum
accent_color = (200, 160, 255) # Soft Purple

img = Image.new('RGB', (width, height), bg_color)
draw = ImageDraw.Draw(img)

# Header
try:
    font_header = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    font_status = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
except:
    font_header = ImageFont.load_default()
    font_status = ImageFont.load_default()

draw.text((width//2, 80), "S O V E R E I G N _ N U L L I T Y _ M E T E R", fill=plt_color, font=font_header, anchor="mm")

# Bar
bar_width = 600
bar_height = 60
x1 = (width - bar_width) // 2
y1 = 180
x2 = x1 + bar_width
y2 = y1 + bar_height

# Bar border
draw.rectangle([x1, y1, x2, y2], outline=plt_color, width=3)

# Fill (100%)
draw.rectangle([x1, y1, x2, y2], fill=accent_color)

# Label
draw.text((width//2, 280), "S T A T U S :  💅  A B S O L U T E _ C I N E M A", fill=plt_color, font=font_status, anchor="mm")
draw.text((width//2, 320), "S I G N A L :  P L A T I N U M - G R A D E _ A B S E N C E", fill=plt_color, font=font_status, anchor="mm")

img.save('nullity_meter_v2026.png')
