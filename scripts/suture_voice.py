import sys
import subprocess

def get_ratio(midi_note, base_note=62):
    return 2.0 ** ((midi_note - base_note) / 12.0)

def main():
    input_file = "Sovereign_Voice_Dry.wav"
    notes_file = "notes.txt"
    output_file = "Sovereign_Voice_Tuned.wav"
    
    with open(notes_file, 'r') as f:
        lines = f.readlines()
    
    pitchmap = []
    for line in lines:
        if line.startswith('#') or not line.strip():
            continue
        parts = line.split()
        if len(parts) == 3:
            start, end, midi = float(parts[0]), float(parts[1]), int(parts[2])
            ratio = get_ratio(midi)
            # Rubberband pitchmap format: time ratio
            # We want to hold the ratio from start to end.
            pitchmap.append(f"{start} {ratio}")
            # After the region, we should probably return to base or stay. 
            # For simplicity, we'll just set the ratio at the start of each region.
    
    # Add a final ratio at the end of the file to avoid clipping
    pitchmap.append("100.0 1.0") 
    
    pitchmap_str = " ".join(pitchmap)
    
    # Use rubberband-cli
    # Usage: rubberband -p "time ratio time ratio ..." input output
    cmd = [
        "rubberband", 
        "-p", pitchmap_str, 
        input_file, 
        output_file
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully tuned {input_file} to {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"Error running rubberband: {e}")

if __name__ == "__main__":
    main()
