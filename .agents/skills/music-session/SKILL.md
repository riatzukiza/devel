---
name: music-session
description: Maintain persistent composition state across a multi-turn agent session (key, BPM, clips, history, pending actions).
---

# Skill: music-session

## Goal
Track the evolving state of a music generation session so agents can reference, modify, and build on prior work within a conversation.

## Use This Skill When
- A composition spans multiple messages or tool calls.
- The user says "change the key", "add a bass line", "make that louder" referring to prior work.
- Saving and resuming a beat session.

## Do Not Use This Skill When
- One-shot generation with no continuation intent.

## Session State Shape
```js
const session = {
  id: nanoid(),
  createdAt: Date.now(),
  bpm: 120,
  key: 'Am',
  scale: 'minor',
  swing: 0,
  clips: [],          // current active clips
  history: [],        // array of prior states (undo stack)
  files: [],          // generated file paths
  manifest: null,     // last loop-pack manifest
};
```

## Steps
1. On session start: initialize state, assign `id`, persist to `/tmp/music-session-<id>.json`.
2. Each modification: push current state to `history`, apply change, save.
3. On "undo": pop `history`, restore.
4. On "save": write final state + all files to `~/.beat-sessions/<id>/`.
5. Reference session id in all Discord replies for traceability.

## Output
- Updated session JSON on disk.
- Session id in agent trace.
