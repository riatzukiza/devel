---
title: "Setup"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-cli-concept.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Setup

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-cli-concept.md`
- Category: `reconstitute`

## Draft Requirements
- `take_note(title, body)` -> make an observation about the codebase and add it to a notes chroma collection
- `list_notes` -> list notes by name
- `search_notes(query, metadata_filter, result_limit, threshold)` -> semantic search notes
- `record_path(path)` -> adds the path to the set of unique paths returning true or false if it's been ecountered already
- `list_recorded_paths`
- `get_file_description(path)`
- `describe_file(path, string)` -> appends a string to a description text associated with a file path
- `search_sessions(query, metadata_filter, result_limit, threshold)` -> searches opencode sessions indexed in chroma
- "Explain what exists at path/to/lost/code"
- "What is path/to/lost/code"
- "what is the entry point path/to/lost/code"
- "what language is path/to/lost/code written in?"

## Summary Snippets
- Alright, so we're using this as the start to a new shell command called "reconstitute" Since everything that we code is saved in the opencode sessions as messages, all of the information needed to rebuild something made with opencode already exists.
- So like I want to run `reconstitute orgs/octave-commons/cephalon-clj` It runs a search for that, then any paths available in the metadata which are in that folder are noted, and a local instance of qwen3-vl:8b-instruct also on ollama will use the messages that come up in the search to build a llm chat context.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
