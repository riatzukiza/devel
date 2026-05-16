import numpy as np
from PIL import Image
import wave
import struct

def generate_spectrogram(image_path, output_path, duration=5.0, sample_rate=44100):
    # Load image, grayscale, and resize
    img = Image.open(image_path).convert('L')
    img = img.resize((512, 512)) # 512 frequency bins, 512 time slices
    data = np.array(img)
    
    # Normalize data
    data = data / 255.0
    
    # Create a time-frequency grid
    # Total samples = duration * sample_rate
    # Each column of the image is a time slice
    num_slices = data.shape[1]
    samples_per_slice = int((duration * sample_rate) / num_slices)
    
    # Frequency bins
    num_bins = data.shape[0]
    # Linear spacing from 20Hz to 10kHz (audible)
    freqs = np.linspace(20, 10000, num_bins)
    
    t = np.arange(duration * sample_rate)
    output_signal = np.zeros(len(t))
    
    # For each frequency bin, add a sine wave modulated by the image
    # This is slow but works for a simple script. 
    # For better quality, we should use IFFT, but additive is easier to implement here.
    # To speed up, we process in chunks.
    
    # Re-sampling to avoid too many sines if needed, but 512C * 512R is a lot.
    # Let's downsample the image slightly.
    img = img.resize((128, 128))
    data = np.array(img) / 255.0
    num_bins, num_slices = data.shape
    freqs = np.linspace(100, 5000, num_bins)
    
    # Time windows
    window_size = int((duration * sample_rate) / num_slices)
    
    for r in range(num_bins):
        f = freqs[r]
        # Create a sequence of amplitudes for this frequency
        amplitudes = data[r, :]
        
        # Generate the sine wave for the whole duration
        sine = np.sin(2 * np.pi * f * np.arange(len(t)) / sample_rate)
        
        # Create a step function for the amplitudes
        # Repeat each amplitude window_size times
        amp_sequence = np.repeat(amplitudes, window_size)
        # Trim or pad to match len(t)
        if len(amp_sequence) > len(t):
            amp_sequence = amp_sequence[:len(t)]
        else:
            amp_sequence = np.pad(amp_sequence, (0, len(t) - len(amp_sequence)))
            
        output_signal += amp_sequence * sine
    
    # Normalize and clip
    output_signal = output_signal / np.max(np.abs(output_signal))
    
    # Write to WAV
    with wave.open(output_path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        # Convert to 16-bit PCM
        packed_data = np.int16(output_signal * 32767).tobytes()
        f.writeframes(packed_data)

if __name__ == "__main__":
    generate_spectrogram('assets/image.png', 'output/potato_spectrogram.wav')
