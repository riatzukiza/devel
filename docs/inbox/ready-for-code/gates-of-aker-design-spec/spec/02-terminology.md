
# Terminology

- **Gate**: A policy module with a *trigger* and *enforcement* behavior (must/should/must-not).
- **Skill**: A documented workflow for producing a class of results (e.g., “PDF creation”).
- **Tool**: An executable capability available to the assistant at runtime (web.run, python, etc.).
- **Artifact**: A file delivered to the user (zip, pdf, docx, pptx, xlsx).
- **Trigger**: A condition derived from the user request or context (e.g., “mentions prior chats”).
- **Enforcement**: The required action or constraint once a gate triggers.
