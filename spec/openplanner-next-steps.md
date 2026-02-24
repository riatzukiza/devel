---
uuid: "bb59cc76-1b01-4a9d-afc3-7a9e340e0e00"
title: "Next steps (suggested build order)"
slug: "openplanner-next-steps"
status: "icebox"
priority: "P2"
labels: ["next", "steps", "suggested", "build"]
created_at: "2026-02-04T13:36:54Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# Next steps (suggested build order)

## 1) Implement importers as job workers

### ChatGPT export importer
- Accept upload (zip) or local file path
- Parse `conversations.json`
- Emit events:
  - conversation meta (title)
  - each message as an event
  - attachments as blobs + attachment refs

### OpenCode importer
- Read OpenCode session store + snapshots
- Emit message events + tool events
- Optionally emit snapshot “workspace tree” events

## 2) Embedding and caption jobs (Chroma)

- For each event with `text`, create embedding and upsert to Chroma
- For image blobs:
  - caption -> store as derived event
  - embed the caption text

## 3) Pack compiler

- For a target (query or session set):
  - retrieve top evidence via FTS + vector
  - synthesize canonical pack (SPEC/DECISIONS/TODO/MANIFEST)
  - store it as derived artifacts (events + blobs)

## 4) Clients

- CLI: `openplanner search`, `openplanner import`, `openplanner pack`
- OpenCode plugin: stream session updates into this API
- UI: session browser + search + pack viewer
