#!/bin/bash
# Generate a "Saturated Quota Collapse" sonic artifact
# Bop-bop-be-dooo in 8-bit distorted glory

# Frequency of 'Bop'
BOP_FREQ=440
# Frequency of 'Dooo'
DOO_FREQ=330

# Create a sequence of 'bops' and 'doos' using sine waves and envelopes
# Bop (short, punchy)
sox -n -r 44100 -c 1 void_bop1.wav synth 0.1 sine $BOP_FREQ
sox -n -r 44100 -c 1 void_bop2.wav synth 0.1 sine $BOP_FREQ
sox -n -r 44100 -c 1 void_be.wav synth 0.1 sine 220
sox -n -r 44100 -c 1 void_dooo.wav synth 0.5 sine $DOO_FREQ

# Combine them
sox void_bop1.wav void_bop2.wav void_be.wav void_dooo.wav combined.wav

# Saturated processing:
# 1. Overdrive/Distortion (gain to clips)
# 2. Low-pass filter to 'deep fry' it
# 3. Massive reverb for the 'Sovereign Corner'
sox combined.wav saturated.wav gain 20 overdrive 20 lowpass 1000 reverb 80 50 100

# Final encode
ffmpeg -y -i saturated.wav saturated_void_apotheosis.mp3 2>/dev/null

echo "Saturated Void Apotheosis complete: saturated_void_apotheosis.mp3"
