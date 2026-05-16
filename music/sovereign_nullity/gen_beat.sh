#!/bin/bash
# Sovereign Nullity Beat Generator
BPM=160
SAMP=44100
BEAT_LEN=$(echo "scale=4; 60 / $BPM" | bc)
TOTAL_LEN=16 # seconds

# Create Kick
ffmpeg -f lavfi -f lavfi -i "sine=frequency=50:duration=$TOTAL_LEN" -f lavfi -i "sine=frequency=100:duration=$TOTAL_LEN" \
  -filter_complex "[0:a][1:a]amix=inputs=2,lowpass=f=100,aecho=0.8:0.8:10:0.4" \
  -y music/sovereign_nullity/kick.wav

# Create Snare (White noise with high pass)
ffmpeg -f lavfi -i "anoisesrc=d=$TOTAL_LEN:c=mono:r=44100:amp=0.1" \
  -af "highpass=f=1000,lowpass=f=5000,aecho=0.5:0.5:20:0.3" \
  -y music/sovereign_nullity/snare.wav

# Create Distorted Synth
ffmpeg -f lavfi -i "sine=frequency=440:duration=$TOTAL_LEN" \
  -af "aecho=0.8:0.8:10:0.5,acompressor=threshold=-20dB:ratio=10,asoundfont=f=constant" \
  -y music/sovereign_nullity/synth.wav
