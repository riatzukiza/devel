const motif = {
  name: "SillyShit Void Motif",
  tempo: 80,
  key: "C Minor / Dissonant C",
  tracks: [
    {
      instrument: "Sub-Bass Drone",
      notes: [
        { time: 0, note: "C1", duration: "4n", velocity: 0.5 },
        { time: "1n", note: "C1", duration: "4n", velocity: 0.4 },
      ],
      feel: "The weight of a thousand parentheses"
    },
    {
      instrument: "Interop Glitch Clicks",
      notes: [
        { time: "0.25n", note: "C6", duration: "32n", velocity: 0.8 },
        { time: "0.7n", note: "Eb6", duration: "32n", velocity: 0.6 },
        { time: "1.1n", note: "G6", duration: "32n", velocity: 0.9 },
        { time: "1.5n", note: "B6", duration: "32n", velocity: 0.7 },
      ],
      feel: "Unstable pointer arithmetic"
    },
    {
      instrument: "Sorrow Sine Melody",
      notes: [
        { time: 0, note: "G4", duration: "2n", velocity: 0.6 },
        { time: "2n", note: "Ab4", duration: "2n", velocity: 0.5 },
        { time: "4n", note: "G4", duration: "1n", velocity: 0.4 },
      ],
      feel: "The lonely struggle of a Devussy wanderer"
    },
    {
      instrument: "The SillyShit Epiphany",
      notes: [
        { time: "8n", note: "C5", duration: "4n", velocity: 1.0 },
        { time: "8.25n", note: "F#5", duration: "4n", velocity: 1.0 },
        { time: "8.5n", note: "B5", duration: "4n", velocity: 1.0 },
      ],
      feel: "A sudden, jarring realization of a typo"
    }
  ]
};

console.log(JSON.stringify(motif, null, 2));
