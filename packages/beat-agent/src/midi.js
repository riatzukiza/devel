import MidiWriter from 'midi-writer-js';
import pkg from '@tonejs/midi';
const { Midi } = pkg;
import fs from 'fs';

export function writeClipsToMidi(clips, outPath) {
  const track = new MidiWriter.Track();
  for (const clip of clips) {
    for (const note of clip.notes ?? []) {
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: Array.isArray(note) ? note : [note],
        duration: '8',
      }));
    }
  }
  const writer = new MidiWriter.Writer([track]);
  fs.writeFileSync(outPath, writer.buildFile());
  return outPath;
}

export function readMidi(path) {
  return new Midi(fs.readFileSync(path));
}
