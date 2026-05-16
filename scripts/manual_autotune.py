
import subprocess
import os

def get_multiplier(target_midi, base_midi=62):
    return 2 ** ((target_midi - base_midi) / 12)

# Notes: start, end, midi
notes = [
    (0.00, 1.00, 60),
    (1.00, 1.80, 64),
    (1.80, 2.50, 67),
    (2.50, 3.50, 62),
    (3.50, 4.50, 60),
    (4.50, 5.00, 62),
    (5.00, 5.50, 64),
    (5.50, 6.50, 67),
    (6.50, 7.20, 72),
    (7.20, 8.00, 67),
    (8.00, 9.00, 76),
    (9.00, 10.00, 72),
    (10.00, 11.00, 67),
    (11.00, 12.00, 64),
    (12.00, 12.30, 60),
    (12.30, 12.60, 60),
    (12.60, 12.90, 60),
    (12.90, 13.10, 72),
]

input_file = "dry_personality_spark.wav"
output_file = "tuned_personality_spark.wav"

filter_complex = ""
for i, (start, end, midi) in enumerate(notes):
    mult = get_multiplier(midi)
    # atrim to get the segment, then rubberband to shift pitch
    filter_complex += f"[0:a]atrim=start={start}:end={end},rubberband=pitch={mult}[a{i}];"

# Concatenate all segments
concat_inputs = "".join([f"[a{i}]" for i in range(len(notes))])
filter_complex += f"{concat_inputs}concat=n={len(notes)}:v=0:a=1[out]"

cmd = [
    "ffmpeg", "-y",
    "-i", input_file,
    "-filter_complex", filter_complex,
    "-map", "[out]",
    output_file
]

print(f"Executing: {' '.join(cmd)}")
subprocess.run(cmd)
