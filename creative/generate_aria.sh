#!/bin/bash
# MIDI to Freq: f = 440 * 2^((n-69)/12)
# 68 -> 415.3
# 64 -> 329.6
# 66 -> 349.2
# 69 -> 440.0
# 71 -> 466.2

notes=(
  "0.5 415.3"
  "0.5 329.6"
  "0.25 329.6"
  "0.25 415.3"
  "0.25 329.6"
  "0.25 415.3"
  "0.5 415.3"
  "0.5 329.6"
  "0.25 329.6"
  "0.25 349.2"
  "1.0 440.0"
  "0.5 440.0"
  "0.5 440.0"
  "0.5 440.0"
  "0.5 349.2"
  "0.5 349.2"
  "0.5 440.0"
  "0.25 349.2"
  "0.25 349.2"
  "0.5 440.0"
  "0.5 440.0"
  "0.25 349.2"
  "0.25 349.2"
  "0.25 349.2"
  "0.25 415.3"
  "0.5 466.2"
  "0.5 466.2"
  "0.25 415.3"
  "0.25 415.3"
  "0.25 415.3"
  "0.25 415.3"
  "0.5 466.2"
  "0.25 415.3"
  "0.25 415.3"
  "0.25 415.3"
  "0.25 415.3"
  "0.25 415.3"
  "1.0 466.2"
  "0.5 466.2"
  "0.5 415.3"
  "0.25 415.3"
  "0.25 349.2"
  "0.5 440.0"
  "0.25 349.2"
  "0.25 349.2"
  "0.5 440.0"
  "0.25 349.2"
  "1.0 440.0"
  "0.25 349.2"
  "0.25 349.2"
  "0.25 349.2"
  "0.25 349.2"
  "0.5 440.0"
  "0.5 440.0"
  "0.25 349.2"
  "0.25 349.2"
  "0.5 415.3"
  "0.5 329.6"
  "0.5 329.6"
  "0.5 415.3"
  "0.5 415.3"
)

rm -f segment.wav combined.wav
for note in "${notes[@]}"; do
  # Split the note string into duration and frequency
  dur=$(echo $note | cut -d' ' -f1)
  freq=$(echo $note | cut -d' ' -f2)
  
  sox -n -r 44100 -c 1 segment.wav synth "$dur" sine "$freq"
  if [ ! -f combined.wav ]; then
    cp segment.wav combined.wav
  else
    sox combined.wav segment.wav combined_tmp.wav
    mv combined_tmp.wav combined.wav
  fi
done

# Add Luxe Reverb
sox combined.wav processed.wav reverb 60 50 100
ffmpeg -y -i processed.wav sovereign_aria_realized.mp3
