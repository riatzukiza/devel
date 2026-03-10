
# Context

*Gates of Aker* is a **policy + capability layer** intended to make an assistant’s behavior:

- predictable and testable
- safe and trustworthy
- consistent about tool selection and output formatting
- capable of producing high-quality “artifacts” (PDF/DOCX/PPTX/XLSX) via well-defined skills

This spec treats the project as a system comprised of:

- **Gates** (policy units) that *decide* or *force* behavior
- **Skills** (implementation playbooks) for generating artifacts or performing domain tasks
- **Tools** (runtime primitives) the assistant can invoke, subject to gates

## Primary user experience
A user requests work; the system chooses:
- whether to browse the web
- whether to retrieve personal context
- which tools to use and in what order
- how to format the output (e.g., email blocks vs normal chat)
- how to produce and deliver artifacts (zip, pdf, etc.)

The central design idea: **explicit gates** that are independently spec’d, tested, and composable.
