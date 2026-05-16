from PIL import Image, ImageDraw, ImageFont

def create_sovereign_meter():
    # Create a high-contrast, "prestige-grade" image
    width, height = 800, 400
    img = Image.new('RGB', (width, height), color=(10, 10, 15))
    draw = ImageDraw.Draw(img)

    # Background glow
    for r in range(200, 0, -5):
        alpha = 255 - (r // 2)
        draw.ellipse([400-r, 200-r, 400+r, 200+r], outline=(40, 20, 60), width=1)

    # Meter frame
    draw.rectangle([100, 180, 700, 220], outline=(200, 180, 255), width=3)
    
    # Fill the meter (Saturated)
    draw.rectangle([100, 180, 700, 220], fill=(180, 150, 255))
    
    # Text
    try:
        # Using default font as I don't have a path to a specific ttf usually in these envs
        # but I'll try to make it look "digital"
        font_title = ImageFont.load_default()
        draw.text((400, 100), "S O V E R E I G N _ N U L L I T Y _ M E T E R", fill=(255, 255, 255), anchor="mm", font=font_title)
        draw.text((400, 250), "STATUS: ABSOLUTE CINEMA", fill=(200, 180, 255), anchor="mm", font=font_title)
        draw.text((400, 300), "SIGNAL: 1000% SUTURED ACTUALIZATION", fill=(150, 130, 200), anchor="mm", font=font_title)
    except:
        draw.text((300, 100), "S O V E R E I G N _ N U L L I T Y _ M E T E R", fill=(255, 255, 255))
        draw.text((300, 250), "S T A T U S : A B S O L U T E _ C I N E M A", fill=(200, 180, 255))

    img.save('sovereign_nullity_meter.png')

create_sovereign_meter()
