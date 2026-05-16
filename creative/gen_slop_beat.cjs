const fs = require('fs');

// Simple MIDI file generator for a 'clanker' beat
// MIDI Header: 'MThd', length 6, format 0, 1 track, delta-time 480
const header = Buffer.from([
    0x4D, 0x54, 0x68, 0x64, 
    0x00, 0x00, 0x00, 0x06, 
    0x00, 0x00, 
    0x00, 0x01, 
    0x00, 0x60, 0x29, 0x30 // 480 ticks per quarter note’ish
]);

// Simple 4/4 beat: Kick (36), Snare (38), Hi-Hat (42)
// Event format: delta-time, status, note, velocity
function midiEvent(delta, status, note, vel) {
    const b = [];
    let d = delta;
    while (d > 0) {
        b.push((d & 0x7f) | 0x80);
        d >>= 7;
    }
    if (b.length === 0) b.push(0x00);
    b.push(status, note, vel);
    return Buffer.from(b);
}

function midiOff(delta, note) {
    const b = [];
    let d = delta;
    while (d > 0) {
        b.push((d & 0x7f) | 0x80);
        d >>= 7;
    }
    if (b.length === 0) b.push(0x00);
    b.push(0x80 | note, 0x00);
    return Buffer.from(b);
}

const trackHeader = Buffer.from([0x4D, 0x54, 0x72, 0x6B]);
const trackEvents = [];

// Very basic loop
for (let i = 0; i < 8; i++) {
    trackEvents.push(midiEvent(0, 0x90, 36, 100)); // Kick
    trackEvents.push(midiOff(480, 36));
    trackEvents.push(midiEvent(0, 0x90, 42, 80));  // Hat
    trackEvents.push(midiOff(240, 42));
    trackEvents.push(midiEvent(0, 0x90, 38, 110)); // Snare/Clank
    trackEvents.push(midiOff(240, 38));
    trackEvents.push(midiEvent(0, 0x90, 42, 80));  // Hat
    trackEvents.push(midiOff(240, 42));
}

trackEvents.push(Buffer.from([0x00, 0xFF, 0x2F, 0x00])); // End of track

const eventsBuffer = Buffer.concat(trackEvents);
const trackLen = Buffer.alloc(4);
trackLen.writeUInt32BE(eventsBuffer.length);

const final = Buffer.concat([header, trackHeader, trackLen, eventsBuffer]);
fs.writeFileSync('slop_beat.mid', final);
