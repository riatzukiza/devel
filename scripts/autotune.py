
import os
import subprocess

def shift_pitch(input_file, output_file, semitones):
    ratio = 2**(semitones/12.0)
    cmd = ["rubberband", "-p", str(ratio), input_file, output_file]
    subprocess.run(cmd, check=True)

input_wav = "dry_vocals.wav"
duration = 16.63
num_segments = 8
seg_len = duration / num_segments

pitches = [0, 4, 7, 12, 7, 4, 0, -12]

segments = []
for i in range(num_segments):
    start = i * seg_len
    out_seg = f"seg_{i}.wav"
    # Extract segment
    cmd = ["ffmpeg", "-y", "-ss", str(start), "-t", str(seg_len), "-i", input_wav, out_seg]
    subprocess.run(cmd, check=True, capture_output=True)
    
    # Shift pitch
    shifted_seg = f"shifted_{i}.wav"
    shift_pitch(out_seg, shifted_seg, pitches[i])
    segments.append(shifted_seg)
    os.remove(out_seg)

# Concatenate segments
with open("concat.txt", "w") as f:
    for seg in segments:
        f.write(f"file '{seg}'\n")

subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "autotuned_vocals.wav"], check=True, capture_output=True)

# Cleanup
for seg in segments:
    os.remove(seg)
os.remove("concat.txt")
