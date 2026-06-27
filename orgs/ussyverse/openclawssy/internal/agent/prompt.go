package agent

import "strings"

const defaultDocHeaderPrefix = "## "

// AssemblePrompt creates a deterministic prompt from ordered artifact docs.
// It preserves input order and truncates each file content by byte count when
// perFileByteLimit is greater than zero.
func AssemblePrompt(docs []ArtifactDoc, perFileByteLimit int) string {
	var b strings.Builder

	for i, doc := range docs {
		if i > 0 {
			b.WriteString("\n")
		}

		b.WriteString(defaultDocHeaderPrefix)
		b.WriteString(doc.Name)
		b.WriteString("\n")

		content := truncateByBytes(doc.Content, perFileByteLimit)
		b.WriteString(content)
		if len(content) > 0 && content[len(content)-1] != '\n' {
			b.WriteString("\n")
		}
	}

	return b.String()
}

func truncateByBytes(s string, limit int) string {
	if limit <= 0 || len(s) <= limit {
		return s
	}
	return s[:limit]
}
