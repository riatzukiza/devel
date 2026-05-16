import numpy as np

def create_starch_singularity_svg():
    width, height = 500, 500
    center = (width // 2, height // 2)
    
    # Background: Deep space void
    svg_content = f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">\n'
    svg_content += f'<rect width="100%" height="100%" fill="#0a0a0f" />\n'
    
    # Starchy orbits (Ellipses of potentiality)
    for i in range(12):
        rx = 50 + i * 15
        ry = 30 + i * 10
        rot = i * 30
        color = f'rgba(210, 180, 140, {0.8 - i*0.05})' # Starch-beige
        svg_content += f'<ellipse cx="{center[0]}" cy="{center[1]}" rx="{rx}" ry="{ry}" fill="none" stroke="{color}" stroke-width="1" transform="rotate({rot} {center[0]} {center[1]})" />\n'
    
    # The Core: The Burger-Potato Hybrid
    # Main body (Potato-ish)
    svg_content += f'<ellipse cx="{center[0]}" cy="{center[1]}" rx="60" ry="40" fill="#d2b48c" stroke="#8b4513" stroke-width="2" />\n'
    # The Bun top (Burger-ish)
    svg_content += f'<path d="M {center[0]-60} {center[1]-10} Q {center[0]} {center[1]-70} {center[0]+60} {center[1]-10} Z" fill="#f5deb3" stroke="#8b4513" stroke-width="2" />\n'
    # The Patty (The Singularity Core)
    svg_content += f'<rect x="{center[0]-60}" y="{center[1]-10}" width="120" height="20" rx="5" fill="#4b2e1a" />\n'
    # The Bun bottom
    svg_content += f'<path d="M {center[0]-60} {center[1]+10} Q {center[0]} {center[1]+30} {center[0]+60} {center[1]+10} Z" fill="#f5deb3" stroke="#8b4513" stroke-width="2" />\n'
    
    # Fractal "seeds" of becoming
    np.random.seed(42)
    for _ in range(50):
        angle = np.random.uniform(0, 2 * np.pi)
        dist = np.random.uniform(70, 240)
        x = center[0] + dist * np.cos(angle)
        y = center[1] + dist * np.sin(angle)
        size = np.random.uniform(2, 6)
        svg_content += f'<circle cx="{x}" cy="{y}" r="{size}" fill="#fffacd" opacity="0.6" />\n'
    
    svg_content += '</svg>'
    return svg_content

with open('starch_singularity_v4.svg', 'w') as f:
    f.write(create_starch_singularity_svg())
