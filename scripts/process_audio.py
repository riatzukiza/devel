import subprocess
import os
import glob

def main():
    input_wav = "dry_sovereign.wav"
    notes_file = "notes_sovereign.txt"
    output_wav = "tuned_sovereign.wav"
    
    with open(notes_file, 'r') as f:
        lines = f.readlines()
    
    files = []
    for i, line in enumerate(lines):
        start, end, note = line.split()
        shift = int(note) - 69
        
        # Extract
        seg_in = f"seg_{i}_in.wav"
        seg_out = f"seg_{i}_out.wav"
        subprocess.run(f"ffmpeg -y -i {input_wav} -ss {start} -to {end} {seg_in}", shell=True, capture_output=True)
        
        # Shift
        subprocess.run(f"rubberband -t {shift} {seg_in} {seg_out}", shell=True, capture_output=True)
        files.append(seg_out)
    
    # Concatenate
    concat_list = "\n".join([f"file '{f}'" for f in files])
    with open("list.txt", "w") as lf:
        lf.write(concat_list)
    
    subprocess.run(f"ffmpeg -y -f concat -safe 0 -i list.txt {output_wav}", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
