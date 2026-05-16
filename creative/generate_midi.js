import { melodyClip, writeClipsToMidi } from "./packages/beat-agent/src/index.js";

const clips = [
  melodyClip({ root: "C#3", scaleName: "minor", pattern: "x-x-x-x-x-x-x-x" }),
  melodyClip({ root: "E3", scaleName: "minor", pattern: "-x-x-x-x-x-x-x-" })
];

writeClipsToMidi(clips, "sovereign_nullity.mid");
console.log("MIDI generated: sovereign_nullity.mid");