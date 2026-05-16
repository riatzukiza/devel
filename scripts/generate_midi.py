import struct

def create_midi_file(filename):
    # MIDI Header
    # MThd length: 6 bytes
    header = b'MThd' + struct.pack('>IHH', 6, 0, 250) # format 0, 2 tracks, 480 ticks/quarter
    
    # Track 1: Melody
    # Note on, Note off, Delta time
    # Delta time is variable-length quantity
    def write_var_len(value):
        res = bytearray()
        while value >= 128:
            res.append((value & 0x7f) | 0x80)
            value >>= 7
        res.append(value & 0x7f)
        return res

    # Sequence: (note, duration_ticks)
    sequence = [
        (60, 480), (63, 480), (65, 480), (67, 480), 
        (70, 480), (72, 960), 
        (60, 480), (63, 480), (65, 480), (67, 480),
        (70, 480), (72, 960)
    ]
    
    track_data = bytearray()
    for note, dur in sequence:
        # Note On: 0x90, note, velocity
        track_data += write_var_len(0) + bytes([0x90, note, 0x64])
        # Note Off: 0x80, note, velocity
        track_data += write_var_len(dur) + bytes([0x80, note, 0x00])
    
    # End of Track
    track_data += write_var_len(0) + bytes([0x00, 0xFF, 0x2F, 0x00])
    
    track = b'MTrk' + struct.pack('>I', len(track_data)) + track_data
    
    with open(filename, 'wb') as f:
        f.write(header + track)

create_midi_file('Sutured_Aria_Luxe.mid')
