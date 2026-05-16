import struct

def create_midi():
    # Simple MIDI File Format 1
    # Track 1: Drums (Channel 10)
    # Track 2: Bass (Channel 1)
    # Track 3: Lead (Channel 2)
    
    # This is a simplified MIDI generator for a house beat
    # Header: MThd (4 bytes) + length (4) + format (2) + tracks (2) + division (2)
    header = b'MThd' + struct.pack('>IHHH', 6, 1, 3, 480)
    
    def make_event(delta, type, data):
        # delta time is variable length
        def encode_varint(n):
            res = bytearray()
            while n >= 128:
                res.append((n & 127) | 128)
                n >>= 7
            res.append(n)
            return res
        
        return encode_varint(delta) + bytes([type]) + data

    # Track 1: Drum Loop (Simplified)
    # 0: Kick, 10: Snare, 11: Hat
    t1_events = []
    for i in range(4): # 4 bars
        for j in range(4): # 4 beats
            # Kick on 1, 2, 3, 4
            t1_events.append(make_event(0, 0x90, struct.pack('BB', 36, 100))) # Note on
            t1_events.append(make_event(480, 0x80, struct.pack('BB', 36, 0)))   # Note off
            
            # Hihat on off-beats
            if j % 2 == 1:
                t1_events.append(make_event(0, 0x90, struct.pack('BB', 42, 80)))
                t1_events.append(make_event(240, 0x80, struct.pack('BB', 42, 0)))

    t1_data = b''.join(t1_events) + bytes([0, 0xFF, 0x2F, 0])
    t1_header = b'MTrk' + struct.pack('>I', len(t1_data)) + t1_data

    # Track 2: Bassline (C# Minor)
    # G# (MIDI 44), C# (MIDI 49), E (MIDI 52)
    t2_events = []
    notes = [49, 49, 44, 49, 52, 49, 44, 49] # Basic syncopated house bass
    for i in range(8):
        n = notes[i % len(notes)]
        t2_events.append(make_event(0, 0x90, struct.pack('BB', n, 90)))
        t2_events.append(make_event(240, 0x80, struct.pack('BB', n, 0)))
    
    t2_data = b''.join(t2_events) + bytes([0, 0xFF, 0x2F, 0])
    t2_header = b'MTrk' + struct.pack('>I', len(t2_data)) + t2_data

    # Track 3: Lead Synth
    t3_events = []
    # Just a simple accent on the 4th beat
    for i in range(4):
        t3_events.append(make_event(480*3, 0x90, struct.pack('BB', 63, 110)))
        t3_events.append(make_event(480, 0x80, struct.pack('BB', 63, 0)))

    t3_data = b''.join(t3_events) + bytes([0, 0xFF, 0x2F, 0])
    t3_header = b'MTrk' + struct.pack('>I', len(t3_data)) + t3_data

    with open('sovereign_beat.mid', 'wb') as f:
        f.write(header + t1_header + t2_header + t3_header)

create_midi()
