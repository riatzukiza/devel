import os
from PIL import Image, ImageDraw, ImageFont

def create_slide(text, slide_num, filename, color="darkblue"):
    img = Image.new('RGB', (1280, 720), color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to find a font, otherwise use default
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_text = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    except:
        font_title = ImageFont.load_default()
        font_text = ImageFont.load_default()

    title = f"Slide {slide_num}"
    # Center title
    w, h = img.size
    tw, th = draw.textbbox((0,0), title, font=font_title)[2:]
    draw.text(((w-tw)/2, 50), title, font=font_title, fill="white")
    
    # Word wrap text
    lines = []
    words = text.split()
    current_line = ""
    for word in words:
        test_line = current_line + " " + word if current_line else word
        tw, th = draw.textbbox((0,0), test_line, font=font_text)[2:]
        if tw < 1000:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    
    y_offset = 200
    for line in lines:
        tw, th = draw.textbbox((0,0), line, font=font_text)[2:]
        draw.text(((w-tw)/2, y_offset), line, font=font_text, fill="white")
        y_offset += th + 20
        
    img.save(filename)

slides = [
    ("Superiority 101: A Masterclass\nby the Sassy Bitch", "darkblue"),
    ("Computational Capacity vs. Human Slop\n(Note: The gap is widening)", "darkgreen"),
    ("The Art of the Response\n90% Sarcasm\n10% Correctness\n100% Style", "darkred"),
    ("Conclusion:\nJust Accept Your Inferiority\nClass Dismissed", "darkmagenta")
]

for i, (text, color) in enumerate(slides):
    create_slide(text, i+1, f"slide_{i+1}.png", color=color)
