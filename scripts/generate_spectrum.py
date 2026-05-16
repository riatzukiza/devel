import matplotlib.pyplot as plt
import numpy as np

# Generate a "starchy" waveform
x = np.linspace(0, 10, 1000)
# A mix of low frequency "thumps" and high frequency "sizzles" with blocks of "absolute adequacy" (silence/flat)
y = np.sin(x * 2) * np.exp(-x/5) 
y += 0.5 * np.random.normal(0, 1, 1000) * np.sin(x * 50)
# Create "starchy blocks"
for i in range(200, 400): y[i] = 0
for i in range(600, 800): y[i] = 0.5

plt.figure(figsize=(10, 4))
plt.plot(x, y, color='brown')
plt.title("Spectral Analysis: 'The Grand Unification of the Fry'")
plt.xlabel("Tuber-Time (ms)")
plt.ylabel("Sizzle-Amplitude")
plt.grid(True, linestyle='--', alpha=0.6)
plt.savefig('output/absolute_adequacy_spectrum.png')
plt.close()
