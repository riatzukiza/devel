from PIL import Image, ImageDraw
img = Image.new('RGB', (400, 300), color='white')
draw = ImageDraw.Draw(img)
draw.ellipse([50, 50, 350, 250], fill='peru', outline='saddlebrown', width=5)
img.save('output/potato.png')
