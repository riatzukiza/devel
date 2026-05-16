import { drumClip, melodyClip, writeClipsToMidi } from "/home/err/devel/packages/beat-agent/src/index.js";

const tempo = 85;
const key = "C";
const scale = "minor";

const kick = drumClip({ pattern: "x---x--x", instrument: "C1" });
const snare = drumClip({ pattern: "--x---x-", instrument: "E1" });
const hat = drumClip({ pattern: "x-x-x-x-", instrument: "F#2" });
const mel = melodyClip({ root: "C3", scaleName: "minor", degrees: [0, 1, 3, 6], pattern: "x-x-xxx-x--x" });

const outPath = "/home/err/devel/slop_beat.mid";
writeClipsToMidi([kick, snare, hat, mel], outPath);

console.log(`Generated slop-beat MIDI at \${outPath} with tempo \${tempo} in \${key} \${scale}`);