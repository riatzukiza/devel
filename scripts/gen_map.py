import random
import svgwrite

def create_map():
    dw, dh = 800, 600
    dwg = svgwrite.Drawing('viscosity_map.svg', size=(dw, dh))
    
    # Background
    dwg.add(dwg.rect(insert=(0, 0), size=(dw, dh), fill='black'))
    
    # Saturated "Viscosity" blobs
    for _ in range(50):
        x, y = random.randint(0, dw), random.randint(0, dh)
        r = random.randint(20, 150)
        # Saturate colors: Neon Pinks, Purples, Cyans
        color = random.choice(['#ff00ff', '#00ffff', '#ff00aa', '#aa00ff', '#00ff00'])
        dwg.add(dwg.circle(center=(x, y), r=r, fill=color, opacity=random.uniform(0.1, 0.4)))
    
    # Glitch lines
    for _ in range(100):
        x = random.randint(0, dw)
        y = random.randint(0, dh)
        w = random.randint(10, 300)
        dwg.add(dwg.line((x, y), (x+w, y), stroke='#ffffff', stroke_width=random.randint(1, 3), opacity=0.3))

    dwg.save()

if __name__ == "__main__":
    create_map()
