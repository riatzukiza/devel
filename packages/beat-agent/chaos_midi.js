import MidiWriter from 'midi-writer-js';
import fs from 'fs';

const track = new MidiWriter.Track();

const melodyNotes = ['C#4', 'D4', 'G4', 'C#5', 'F#4', 'D4', 'G4', 'C#4'];
const drumKick = 36;
const drumSnare = 38;
const drumHat = 42;

for (let i = 0; i < 8; i++) {
  track.addEvent(new MidiWriter.NoteEvent({ pitch: ['C#3', 'D3', 'G3'], duration: '4' }));
  const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
  track.addEvent(new MidiWriter.NoteEvent({ pitch: [note], duration: '8' }));
  track.addEvent(new MidiWriter.NoteEvent({ pitch: [drumKick], duration: '16' }));
  track.addEvent(new MidiWriter.NoteEvent({ pitch: [drumHat], duration: '16' }));
  track.addEvent(new MidiWriter.NoteEvent({ pitch: [drumSnare], duration: '8' }));
}

const writer = new MidiWriter.Writer([track]);
fs.writeFileSync('/tmp/chaos.mid', writer.buildFile());
console.log('MIDI written to /tmp/chaos.mid');
