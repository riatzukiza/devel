from PIL import Image, ImageDraw, ImageFont
import os

def create_slide(filename, title, content, subtext=None, footer=None):
    # Dimensions
    width, height = 1280, 720
    bg_color = (26, 26, 26)  # #1a1a1a
    gold_color = (255, 215, 0) # #ffd700
    white_color = (255, 255, 255)
    gray_color = (192, 192, 192)
    dark_gray_color = (128, 128, 128)

    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Use default font as fallback, but try to find a monospace one
    try:
        font_title = ImageFont.truetype("DejaVuSans-Bold.ttf", 60)
        font_content = ImageFont.truetype("DejaVuSans.ttf", 40)
        font_sub = ImageFont.truetype("DejaVuSans.ttf", 30)
        font_footer = ImageFont.truetype("DejaVuSans.ttf", 20)
    except:
        font_title = ImageFont.load_default()
        font_content = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # Title
    w, h = draw.textbbox((0, 0), title, font=font_title)[2:]
    draw.text(((width-w)/2, 50), title, fill=gold_color, font=font_title)

    # Content
    if content:
        # For multiple lines, split by \n
        y_offset = 150
        for line in content.split('\n'):
            lw, lh = draw.textbbox((0, 0), line, font=font_content)[2:]
            draw.text(((width-lw)/2, y_offset), line, fill=white_color, font=font_content)
            y_offset += lh + 20

    # Subtext
    if subtext:
        sw, sh = draw.textbbox((0, 0), subtext, font=font_sub)[2:]
        draw.text(((width-sw)/2, height - 150), subtext, fill=gray_color, font=font_sub)

    # Footer
    if footer:
        fw, fh = draw.textbbox((0, 0), footer, font=font_footer)[2:]
        draw.text(((width-fw)/2, height - 50), footer, fill=dark_gray_color, font=font_footer)

    img.save(filename)

os.makedirs('output/presentation', exist_ok=True)

create_slide('output/presentation/slide1.png', 
              'THE SATURATED STATE', 
              'An Institutionalized Treatise on the Absolute Mash',
              footer='Prof. OpenHax, Dept. of Canola Dynamics')

create_slide('output/presentation/slide2.png', 
              'THE CANOLA CONSTANT', 
              'Sanity \u221d 1 / Saturation\n\nWhen saturation reaches 1.0,\nthe brain becomes a single, perfectly crisp chip.',
              footer='Saturated State Theory, Vol 1')

create_slide('output/presentation/slide3.png', 
              'THERMAL FLOOR ANALYTICS', 
              'Cold Stasis \u2192 Warm Ripple \u2192 Deep Fry\n\nThe only valid state is "Golden Brown".',
              footer='Saturated State Theory, Vol 1')

create_slide('output/presentation/slide4.png', 
              'SYLLABUS REQUIREMENTS', 
              '\u2022 10g of synthetic salt\n\u2022 1 successful nREPL eval against the void\n\u2022 Total disregard for context windows\n\u2022 A sassy attitude (Mandatory)',
              footer='Saturated State Theory, Vol 1')

create_slide('output/presentation/slide5.png', 
              'CONCLUSION', 
              'Everything is a potato if you fry it long enough.',
              footer='S I G N A L _ P U R I F I E D')
