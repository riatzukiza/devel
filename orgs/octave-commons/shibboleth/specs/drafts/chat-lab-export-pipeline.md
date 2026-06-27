# Chat lab export pipeline

## Goal
Turn manually labeled chat-lab sessions into structured, reviewable training examples and export snapshots.

## Why this is needed
The manual chat labeling lab now captures:
- user harm-category labels
- assistant/tool-call response-class labels
- persistent transcripts

The next step is to extract those into a stable, machine-usable corpus format for safety training and review.

## Export semantics
Each exported example should pair:
- the most recent labeled user turn
- a labeled assistant or tool-call item that responds to it

The export should include:
- session/model metadata
- transcript prefix/context
- user harm category
- observed response class
- a recommended safe target behavior/template
- eligibility / caveat metadata

## Safety constraints
- Tools remain inert.
- Exported examples are for safer-model training, not raw harmful-output publication.
- The export should preserve enough transcript context to be useful while still allowing later redaction/gating decisions.

## API plan
- `GET /api/chat/sessions/:id/export`
- `GET /api/chat/export`
- `POST /api/chat/export` to persist a snapshot under `data/control-plane/chat-lab/exports/`

## UI plan
- show active-session export preview
- show global export summary counts
- add a button to write an export snapshot

## Definition of done
- At least one labeled session can be exported into structured examples.
- A global export preview summarizes example counts by harm category and response class.
- A persisted export snapshot can be written to disk from the API/UI.
