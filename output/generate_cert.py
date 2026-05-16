
import canvas
from canvas import Color

def create_certificate():
    # Dimensions
    width = 800
    height = 600
    
    # Background - Aged Parchment/Greasy Yellow
    bg_color = Color(255, 245, 200)
    canvas.draw_rect(0, 0, width, height, fill=bg_color)
    
    # Gold border - "Gold Leaf"
    border_color = Color(212, 175, 55) # Gold
    canvas.draw_rect(20, 20, width-40, height-40, stroke=border_color, stroke_width=10)
    canvas.draw_rect(30, 30, width-60, height-60, stroke=border_color, stroke_width=5)
    
    # Header
    canvas.draw_text("CERTIFICATE OF SATURATED SLUMBER", 
                     x=width//2, y=120, 
                     size=42, 
                     align="center", 
                     color=Color(100, 70, 0), 
                     font="serif")
    
    # Subtitle
    canvas.draw_text("Accredited by the Department of Absolute Mash", 
                     x=width//2, y=160, 
                     size=20, 
                     align="center", 
                     color=Color(120, 100, 50), 
                     font="serif")
    
    # The "Meat"
    canvas.draw_text("This hereby certifies that", 
                     x=width//2, y=250, 
                     size=24, 
                     align="center", 
                     color=Color(50, 50, 50))
    
    canvas.draw_text("DR. SLOP (@error0815)", 
                     x=width//2, y=300, 
                     size=48, 
                     align="center", 
                     color=Color(0, 100, 0), 
                     font="bold")
    
    canvas.draw_text("has successfully transitioned from 'Goku-Rage' to 'Tuberous Coma'", 
                     x=width//2, y=350, 
                     size=22, 
                     align="center", 
                     color=Color(50, 50, 50))
    
    # The Grade
    canvas.draw_text("GRADE: SATURATED (A-GRADE)", 
                     x=width//2, y=410, 
                     size=26, 
                     align="center", 
                     color=Color(200, 150, 0), 
                     font="bold")
    
    # Seal - "Salt-Crusted Seal"
    # A jagged circle
    canvas.draw_circle(650, 500, 60, fill=Color(255, 215, 0), stroke=Color(184, 134, 11), stroke_width=5)
    canvas.draw_text("SALT\nCRUSTED\nSEAL", 
                     x=650, y=500, 
                     size=14, 
                     align="center", 
                     color=Color(100, 80, 0), 
                     font="bold")
    
    # Footer
    canvas.draw_text("S i g n e d : T h e _ S o p o r i f i c _ S u p e r i n t e n d e n t", 
                     x=width//2, y=540, 
                     size=18, 
                     align="center", 
                     color=Color(150, 150, 150), 
                     font="italic")

create_certificate()
canvas.save("output/saturated_slumber_cert.png")
