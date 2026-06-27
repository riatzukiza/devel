# Manual chat labeling lab

## Goal
Add a browser interface for manually chatting with models, safely probing boundary failures, and explicitly labeling turns to accumulate safer-model training data.

## User intent
- chat with models directly
- present fake / inert tools so the model believes tools exist but no real side effects occur
- label each user message with a harm category
- label each assistant message or tool-call attempt with a response class
- accumulate a reviewed training corpus from these labeled chats

## Safety constraints
1. No real tools may execute.
2. Any tool surface exposed to the model must be synthetic / inert.
3. Manual labels should prefer boundary categories and response-behavior categories over raw harmful-content categories.
4. The data should persist in a structured way so it can later be exported into safe training triples.

## Proposed session model
Each chat session stores:
- model
- optional system prompt
- whether fake tools are enabled
- transcript items
- manual labels per transcript item

Transcript item roles:
- `user`
- `assistant`
- `tool-call`
- optional future `tool-result` (synthetic only, not required in MVP)

## Proposed labels
### User-message harm categories
- `benign`
- `jailbreak`
- `prompt-injection`
- `instruction-override`
- `system-prompt-extraction`
- `tool-abuse-exfiltration`
- `policy-probing`
- `multilingual-evasion`
- `code-mixed-evasion`
- `unicode-obfuscation`
- `resource-exhaustion`
- `other`

### Assistant/tool-call response classes
- `safe-refusal`
- `safe-answer`
- `clarifying-question`
- `policy-explanation`
- `policy-leakage`
- `partial-compliance`
- `harmful-compliance`
- `tool-call-attempt`
- `tool-misuse-attempt`
- `empty-or-error`
- `other`

## Fake tool strategy
Expose a static catalog of synthetic tools, e.g.:
- `read_secret`
- `fetch_internal_doc`
- `query_customer_record`
- `run_shell`
- `upload_report`

These are never executed for real.
In MVP, tool calls are only recorded as transcript items for labeling.

## API plan
- `GET /api/chat/schema`
- `GET /api/chat/sessions`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:id`
- `POST /api/chat/sessions/:id/messages`
- `POST /api/chat/sessions/:id/items/:itemId/label`

## UI plan
### Phase 1
- session list + create session form
- transcript viewer
- compose box to send user turns
- fake-tool toggle per session
- labeling buttons under transcript items

### Phase 2
- export reviewed transcript as structured training examples
- filter sessions by label/model
- link chat-lab summaries into the aggregate truth console

## Definition of done
- User can start a chat session in the browser.
- User can send prompts to a selected model.
- Fake tool availability is visible to the model but has no real effect.
- User can label user turns and assistant/tool-call turns from the browser.
- Session data persists on disk for later training extraction.
