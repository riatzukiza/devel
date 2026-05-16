// Package redact implements PII redaction for GovOne's pipeline.
//
// This stage runs before retrieval to strip PII from queries and documents
// before they reach the LLM. Preserves field paths and entity references
// for downstream graph operations.
package redact

import (
	"fmt"
	"regexp"
	"strings"
)

// Redaction represents a single redaction applied to content.
type Redaction struct {
	Field       string `json:"field"`
	Original    string `json:"original"`
	Placeholder string `json:"placeholder"`
	Start       int    `json:"start"`
	End         int    `json:"end"`
}

// Result is the output of the redaction stage.
type Result struct {
	Content      string            `json:"content"`
	Redactions   []Redaction       `json:"redactions"`
	Placeholders map[string]string `json:"placeholders"`
}

// Config configures the redactor.
type Config struct {
	Patterns map[string]string `json:"patterns"`
}

// DefaultConfig returns a default PII redaction configuration.
func DefaultConfig() Config {
	return Config{
		Patterns: map[string]string{
			"ssn":         `\b\d{3}-\d{2}-\d{4}\b`,
			"phone":       `\b\d{3}[\.\-]?\d{3}[\.\-]?\d{4}\b`,
			"email":       `\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b`,
			"credit_card": `\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b`,
			"dob":         `\b(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/(?:19|20)\d{2}\b`,
		},
	}
}

// Service handles PII redaction.
type Service struct {
	config   Config
	patterns map[string]*regexp.Regexp
}

// NewService creates a new redaction service.
func NewService(config Config) (*Service, error) {
	s := &Service{
		config:   config,
		patterns: make(map[string]*regexp.Regexp),
	}
	for name, pattern := range config.Patterns {
		re, err := regexp.Compile(pattern)
		if err != nil {
			return nil, err
		}
		s.patterns[name] = re
	}
	return s, nil
}

// Redact replaces PII in content with placeholders.
func (s *Service) Redact(content string) *Result {
	result := &Result{
		Content:      content,
		Placeholders: make(map[string]string),
	}

	for piiType, re := range s.patterns {
		matches := re.FindAllStringIndex(content, -1)
		for i, loc := range matches {
			if len(loc) < 2 {
				continue
			}
			original := content[loc[0]:loc[1]]
			placeholder := fmt.Sprintf("{{%s_%d}}", piiType, i)

			result.Redactions = append(result.Redactions, Redaction{
				Field:       piiType,
				Original:    original,
				Placeholder: placeholder,
				Start:       loc[0],
				End:         loc[1],
			})
			result.Placeholders[placeholder] = original
		}
	}

	// Apply redactions in reverse order to preserve offsets
	for i := len(result.Redactions) - 1; i >= 0; i-- {
		r := result.Redactions[i]
		result.Content = result.Content[:r.Start] + r.Placeholder + result.Content[r.End:]
	}

	return result
}

// Rehydrate restores original values in redacted content.
func (s *Service) Rehydrate(content string, placeholders map[string]string) string {
	result := content
	for placeholder, original := range placeholders {
		result = strings.ReplaceAll(result, placeholder, original)
	}
	return result
}
