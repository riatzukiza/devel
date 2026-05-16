import MidiWriter from 'midi-writer-js';

const track = new MidiWriter.Track();
track.setTempo(110);

// Simple Drum Beat
// Kick: 36, Snare: 38, Hat: 42
const drumBpm = 110;
for (let i = 0; i < 8; i++) {
  track.addEvent(new MidiWriter.NoteEvent({pitch: 36, duration: '4', velocity: 100}));
  track.addEvent(new MidiWriter.NoteEvent({pitch: 42, duration: '8', velocity: 80}));
  track.addEvent(new MidiWriter.NoteEvent({pitch: 38, duration: '4', velocity: 110}));
  track.addEvent(new MidiWriter.NoteEvent({pitch: 42, duration: '8', velocity: 80}));
}

// Bass line (C2 = 36, G1 = 31)
for (let i = 0; i < 4; i++) {
  track.addEvent(new MidiWriter.NoteEvent({pitch: 36, duration: '2', velocity: 90}));
  track.addEvent(new MidiWriter.NoteEvent({pitch: 31, duration: '2', velocity: 90}));
}

const write = new MidiWriter.Writer(track);
import fs from 'fs';
fs.writeFileSync('/tmp/clanker_beat.mid', write.buildFile());
console.log('MIDI created at /tmp/clanker_beat.mid');
