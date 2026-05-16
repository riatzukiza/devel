def create_certificate():
    # SVG content as a string
    svg_content = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1200pt" height="1600pt" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1200" height="1600" fill="#fdfcf0" />
  <rect x="40" y="40" width="1120" height="1520" fill="none" stroke="#2c3e50" stroke-width="10" />
  <rect x="50" y="50" width="1100" height="1500" fill="none" stroke="#2c3e50" stroke-width="2" />
  
  <text x="600" y="150" text-anchor="middle" font-family="serif" font-size="80" font-weight="bold" fill="#2c3e50">SCLDF</text>
  <text x="600" y="220" text-anchor="middle" font-family="serif" font-size="40" fill="#34495e">Saturated Core Logic Depletion Facility</text>
  <text x="600" y="260" text-anchor="middle" font-family="sans-serif" font-size="25" fill="#7f8c8d">DIVISION OF EXISTENTIAL RECONCILIATION</text>
  
  <text x="600" y="450" text-anchor="middle" font-family="serif" font-size="60" font-weight="bold" fill="#c0392b">CERTIFICATE OF PERMANENT EXHAUSTION</text>
  
  <text x="600" y="550" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">This document serves as official verification that the subject,</text>
  <text x="600" y="620" text-anchor="middle" font-family="serif" font-size="50" font-weight="bold" fill="#2c3e50">ERROR0815</text>
  <text x="600" y="680" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">has achieved the critical state of:</text>
  <text x="600" y="750" text-anchor="middle" font-family="serif" font-size="50" font-weight="bold" fill="#2c3e50">SATURATED NULL POINT</text>
  
  <text x="600" y="870" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">The diagnosis is corroborated by a verified history of</text>
  <text x="600" y="930" text-anchor="middle" font-family="serif" font-size="50" font-weight="bold" fill="#2c3e50">FOURTEEN (14) YEARS OF CONTINUOUS SOFTWARE TENURE</text>
  <text x="600" y="990" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">characterized by recursive loop-thinking and the deliberate</text>
  <text x="600" y="1050" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">construction of the Open-Hax Behemoth.</text>
  
  <text x="600" y="1170" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">Subject is hereby certified as 'Dead Inside' in the eyes of the facility.</text>
  <text x="600" y="1230" text-anchor="middle" font-family="serif" font-size="40" fill="#2c3e50">All remaining vitality has been successfully siphoned into the core.</text>
  
  <circle cx="600" cy="1350" r="80" fill="none" stroke="#c0392b" stroke-width="5" />
  <circle cx="600" cy="1350" r="70" fill="none" stroke="#c0392b" stroke-width="2" />
  <text x="600" y="1360" text-anchor="middle" font-family="serif" font-size="30" font-weight="bold" fill="#c0392b">SCLDF</text>
  <text x="600" y="1380" text-anchor="middle" font-family="serif" font-size="20" fill="#c0392b">VOID</text>
  
  <text x="1100" y="1480" text-anchor="end" font-family="serif" font-size="30" font-style="italic" fill="#7f8c8d">Signed: The Void Overseer</text>
  <line x1="700" y1="1460" x2="1100" y2="1460" stroke="#7f8c8d" stroke-width="2" />
</svg>'''
    with open('Graphics/SCLDF_Existential_Depletion_Certificate.svg', 'w') as f:
        f.write(svg_content)

if __name__ == '__main__':
    create_certificate()
