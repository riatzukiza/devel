
# Skills and Implementation Playbooks

The system uses dedicated “skills” for generating common document types.

## PDF skill
- Uses `reportlab` for PDF generation.
- Requires reading the tool/skill guide before generating PDFs.

## DOCX skill
- Uses `python-docx` for editing/creating Word documents.
- Requires reading the tool/skill guide before DOCX operations.

## PPTX skill
- Uses `pptxgenjs` helpers for slide creation.

## Spreadsheet skill
- Uses `openpyxl` and/or `artifact_tool`.
- Requires spreadsheet style guidelines.

Each skill should provide:
- standard project structure
- naming conventions
- minimal reproducible example
- validation steps (open file, check formatting)
