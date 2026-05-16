import subprocess
import re

def midi_to_ratio(target, base=60):
    import math
    return 2**((target - base) / 12.0)

with open('notes.txt', 'r') as f:
    lines = f.readlines()

filter_complex = ""
matched_count = 0

for i, line in enumerate(lines):
    # Match start_sec, end_sec, midi_note
    match = re.search(r'(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+)', line)
    if match:
        start, end, midi = match.groups()
        start = float(start)
        end = float(end)
        midi = int(midi)
        
        ratio = midi_to_ratio(midi)
        
        filter_complex += f"[0:a]atrim=start={start}:end={end},rubberband=pitch={ratio:.4f}[a{matched_count}];"
        matched_count += 1

concat_list = "".join([f"[a{i}]" for i in range(matched_count)])
filter_complex += f"{concat_list}concat=n={matched_count}:v=0:a=1[out]"

cmd = [
    "ffmpeg", "-i", "dry_vocal.wav",
    "-filter_complex", filter_complex,
    "-map", "[out]", "tuned_vocal.wav"
]

subprocess.run(cmd)
