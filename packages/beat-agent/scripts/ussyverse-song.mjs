#!/usr/bin/env node
/**
 * 🌌 USSYVERSE ANTHEM 🌌
 * A cosmic banger about the infinite multiverse of ussy.
 *
 * Genre: Trap / Hyperpop hybrid
 * BPM: 140 (half-time feel at 70)
 * Key: F# minor (dark, mysterious, cosmic)
 */

import * as scribble from 'scribbletune';
import { Scale, Chord } from '@tonaljs/tonal';
import MidiWriter from 'midi-writer-js';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/tmp/ussyverse';
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── HELPERS ────────────────────────────────────────────────────────
function clipToTrack(clip, channel = 0, instrument = 0) {
  const track = new MidiWriter.Track();
  track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument, channel }));
  
  for (const step of clip) {
    if (step.note && step.note.length > 0) {
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: step.note,
        duration: 'T' + step.length,
        velocity: step.level || 100,
        channel,
      }));
    }
  }
  return track;
}

// ─── BPM ────────────────────────────────────────────────────────────
const BPM = 140;

// ─── DRUM PATTERNS (Channel 9 = GM drums) ──────────────────────────
const kick    = scribble.clip({ notes: ['C1'], pattern: 'x---x---x---x-x-' });
const snare   = scribble.clip({ notes: ['D1'], pattern: '----x-------x---' });
const hat     = scribble.clip({ notes: ['F#1'], pattern: 'x-x-x-x-x-x-x-x-' });
const openHat = scribble.clip({ notes: ['A#1'], pattern: '--------x-------' });
const clap    = scribble.clip({ notes: ['D#1'], pattern: '----x-------x---' });

// ─── BASS (808 style, Channel 0) ────────────────────────────────────
const bassNotes = ['F#2', 'F#2', 'A2', 'F#2', 'C#3', 'F#2', 'A2', 'B2'];
const bass = scribble.clip({ notes: bassNotes, pattern: 'x---x---x-x-x---' });

// ─── LEAD MELODY (Channel 1) ────────────────────────────────────────
const scale = Scale.get('F#4 minor');
const leadDegrees = [0, 2, 4, 6, 4, 2, 0, 5, 6, 4, 2, 0];
const leadNotes = leadDegrees.map(i => scale.notes[i % scale.notes.length]);
const lead = scribble.clip({ notes: leadNotes, pattern: 'x-x-x-x-x-x-x-x-x-x-x-x-' });

// ─── PAD CHORDS (Channel 2) ─────────────────────────────────────────
// F#m → D → A → E
const padProgression = [
  Chord.get('F#m').notes.map(n => n + '3'),
  Chord.get('D').notes.map(n => n + '3'),
  Chord.get('A').notes.map(n => n + '3'),
  Chord.get('E').notes.map(n => n + '3'),
];
const padNotes = padProgression.flat();
const pad = scribble.clip({ notes: padNotes, pattern: 'x---x---x---x---' });

// ─── ARP SYNTH (Channel 3) ──────────────────────────────────────────
const arpScale = Scale.get('F#5 minor pentatonic');
const arpDegrees = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0];
const arpNotes = arpDegrees.map(i => arpScale.notes[i % arpScale.notes.length]);
const arp = scribble.clip({ notes: arpNotes, pattern: 'xxxxxxxxxxxxxxx-' });

// ─── BUILD MIDI ─────────────────────────────────────────────────────
const tracks = [
  clipToTrack(kick, 9),      // GM drums
  clipToTrack(snare, 9),
  clipToTrack(hat, 9),
  clipToTrack(openHat, 9),
  clipToTrack(clap, 9),
  clipToTrack(bass, 0, 38),  // Synth Bass
  clipToTrack(lead, 1, 81),  // Lead Synth
  clipToTrack(pad, 2, 89),   // Pad
  clipToTrack(arp, 3, 84),   // Synth Lead 2
];

// Set tempo on first track
tracks[0].addEvent(new MidiWriter.TempoEvent({ bpm: BPM }));

const writer = new MidiWriter.Writer(tracks);
const midiPath = path.join(OUT_DIR, 'ussyverse-anthem.mid');
fs.writeFileSync(midiPath, writer.buildFile());
console.log(`✨ MIDI written to ${midiPath}`);

// ─── LYRIC SCAFFOLD ─────────────────────────────────────────────────
const lyrics = `
═══════════════════════════════════════════════
  🌌  U S S Y V E R S E   A N T H E M  🌌
═══════════════════════════════════════════════

KEY: F# minor | BPM: 140 | FEEL: Cosmic Trap

─── [INTRO] 4 bars ───────────────────────────
  (atmospheric synth swell, 808 rumble)
  ♪ "Welcome to the ussyverse..." ♪ (whispered, reverb-drenched)

─── [VERSE 1] 8 bars ─────────────────────────
  AABB rhyme scheme | ~14 syllables/line

  Step through the portal, dimensions collide       (A)
  Infinite realities all open wide                    (A)
  Every timeline got a version of the vibe            (B)
  Multiverse of ussy and I'm feeling alive            (B)

  Quantum entangled in the fabric of space            (C)
  Every universe I land, I'm the life of the place    (C)
  Schrödinger's kitty but I'm always on beat          (D)
  Superposition got me dancing on my feet             (D)

─── [PRE-CHORUS] 4 bars ───────────────────────
  Build energy, half-time snare rolls

  Can you feel it? (feel it!)                         (A)
  The bass is shaking every realm                     (A)
  Can you see it? (see it!)                           (B)
  The ussyverse has overwhelmed                       (B)

─── [CHORUS] 8 bars ───────────────────────────
  Drop! Full 808s, wide stereo, hook melody

  Welcome to the ussyverse! (ussyverse!)              (A)
  Every dimension makes it worse! (so worse!)         (A)
  In the ussyverse! (ussyverse!)                      (B)
  Infinite and nothing hurts!                         (B)

  Welcome to the ussyverse! (ussyverse!)              (A)
  Riding through the cosmic surf! (cosmic surf!)      (A)
  In the ussyverse! (ussyverse!)                      (B)
  Baby, this is more than flirt!                      (B)

─── [VERSE 2] 8 bars ─────────────────────────
  Deeper exploration, more confident flow

  String theory got me wrapped up in your gravity      (A)
  Every particle attracted, that's a fact not a maybe  (A)
  Dark energy expanding every second that we breathe   (B)
  Multiverse of pleasure that no science can conceive  (B)

  From the quarks up to the galaxies above             (C)
  Every frequency is vibrating with love               (C)
  Parallel dimensions, every version of us             (D)
  All converging in the ussyverse, no rush             (D)

─── [CHORUS] 8 bars ───────────────────────────
  (repeat with ad-libs)

─── [BRIDGE] 4 bars ───────────────────────────
  Breakdown — stripped to kick + vocal

  They said the universe was cold and dark...          (A)
  But they never saw the ussyverse spark...            (A)
  Big bang energy in every single part...              (B)
  Infinite dimensions, infinite heart...              (B)

─── [FINAL CHORUS] 8 bars ─────────────────────
  Full production, key change up a half-step to G minor

  Welcome to the ussyverse! (ussyverse!)              (A)
  Every dimension makes it worse! (so worse!)         (A)
  In the ussyverse! (ussyverse!)                      (B)
  Infinite and nothing hurts!                         (B)

─── [OUTRO] 4 bars ────────────────────────────
  (synths fade, reverb tail, whispered:)
  ♪ "The ussyverse is forever..." ♪

═══════════════════════════════════════════════
  PRODUCTION NOTES
═══════════════════════════════════════════════

DRUMS:
  - 808 kick with long sustain, sidechain everything
  - Layered snare + clap, slight delay on clap
  - Constant 16th hi-hats with velocity variation
  - Open hat every 2 bars for tension

BASS:
  - Mono 808 sub, saturation for harmonics
  - Slides between notes for trap feel

LEAD:
  - Detuned saw synth, heavy reverb, ping-pong delay
  - Filter sweep on build sections

PADS:
  - Lush supersaw pad, slow attack, long release
  - Stereo widening, gentle low-pass filter

ARP:
  - Pluck synth, 1/16th notes, high register
  - Panned slightly right, light chorus effect

VOCALS:
  - Main: dry with plate reverb throws
  - Ad-libs: heavy autotune, octave doubled
  - Whispers: massive hall reverb, low-pass filtered
`;

const lyricPath = path.join(OUT_DIR, 'ussyverse-lyrics.txt');
fs.writeFileSync(lyricPath, lyrics.trim());
console.log(`📝 Lyrics written to ${lyricPath}`);

console.log(`\n🌌 USSYVERSE ANTHEM composed!`);
console.log(`   BPM: ${BPM} | Key: F# minor | Genre: Cosmic Trap`);
console.log(`   MIDI: ${midiPath}`);
console.log(`   Lyrics: ${lyricPath}`);
