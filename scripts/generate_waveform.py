import numpy as np
from PIL import Image

# Create a 'Saturated Waveform' that is basically a brick wall
width, height = 800, 400
img = np.zeros((height, width, 3), dtype=np.uint8)

# Fill with saturated gold
img[:] = [255, 215, 0]

# Add 'Saturation Red' blocks
for _ in range(20):
    x = np.random.randint(0, width)
    w = np.random.randint(10, 50)
    img[:, x:x+w] = [255, 0, 0]

# Add some 'Grease' noise
noise = np.random.randint(0, 50, (height, width, 3), dtype=np.uint8)
img = np.clip(img + noise, 0, 255).astype(np.uint8)

Image.fromarray(img).save('output/saturated_waveform.png')
