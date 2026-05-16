import midutil
from midutil import MIDIFile

# 160 BPM
midi = MIDIFile(1)
midi.addTempo(0, 0, 160)

# Simple Hyperpop Beat (Kick, Snare, Bass)
# Kick on 1, 3
for i in range(0, 16):
    if i % 2 == 0:
        midi.addNote(0, 0, 36, 0, 1, 100) # Kick
    if i % 4 == 2:
        midi.addNote(0, 0, 38, 0, 1, 110) # Snare

# High-viscosity bass (C#)
for i in range(0, 16):
    midi.addNote(0, 0, 31, 0, 1, 120) # C# Bass

with open('beat.mid', 'wb') as output_file:
    midi.writeFile(output_file)
