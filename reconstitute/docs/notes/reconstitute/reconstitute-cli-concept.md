Alright, so we're using this as the start to a new shell command called "reconstitute"
Since everything that we code is saved in the opencode sessions as messages, all of the information needed to rebuild something made with opencode already exists.

So like I want to run `reconstitute orgs/octave-commons/cephalon-clj`
It runs a search for that, then any paths available in the metadata which are in that folder are noted, and a local instance of qwen3-vl:8b-instruct also on ollama will use the messages that come up in the search to build a llm chat context.

So I need to be able to turn the opencode session messages into ollama chat messages exactly, so the similar messages can be used directly as they happened in the ollama call.

The chroma search returns an ollama chat ready message array to use as context ask it questions

## Setup

All sessions must be indexed.
uses level db to store facts learned
genereated embeddings, search queries, and ollama queries are cached with a ttl for
recovery/search/resume

## Ollama tools


- `take_note(title, body)` -> make an observation about the codebase and add it to a notes chroma collection
- `list_notes` -> list notes by name
- `search_notes(query, metadata_filter, result_limit, threshold)` -> semantic search notes
- `record_path(path)` -> adds the path to the set of unique paths returning true or false if it's been ecountered already
- `list_recorded_paths`
- `get_file_description(path)`
- `describe_file(path, string)` -> appends a string to a description text associated with a file path
- `search_sessions(query, metadata_filter, result_limit, threshold)` -> searches opencode sessions indexed in chroma

## Questions

We query chroma, and ask an LLM agent with tool use, the same questions for each path encountered:

1. "Explain what exists at path/to/lost/code"
2. "What is path/to/lost/code"
3. "what is the entry point path/to/lost/code"
3. "what language is path/to/lost/code written in?"
4. "What api does path/to/lost/code provide?"
5. etc
## Workflow

1. `reconstitute path/to/lost/code` 
2. query chroma for each question generating an ollama context array from the session messages found in chroma
3. For each query context array
   1. Ask ollama to extract every path from the conversation (the search results )
    - you do this repeatedly until there is a run where no new paths are encountered
   2. Ask ollama each of our questions
4. For every path, re run the workflow until no new paths are encountered
5. When all paths have been exhausted, create a new folder populated by markdown files in the same structure as the recovered directory tree, each of them containing the full description string the system created through concatenation with tools.

This way, I can use these small models to get all the info from the sessions, and ask a proper coding agent to rebuild the project from the descriptions in that folder.
