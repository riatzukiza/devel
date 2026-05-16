// Package classifier implements document classification for GovOne's pipeline.
//
// DELEGATE-52 hardening: Classification must be deterministic and auditable.
// The classifier extracts structured fields from documents using rule-based
// methods, not LLM extraction — avoiding the corruption vector DELEGATE-52 identified.
package classifier

import (
	"encoding/json"
	"regexp"
	"strings"
	"time"
)

// Classification is the output of the classifier stage.
type Classification struct {
	DocumentType string          `json:"document_type"`
	Fields       map[string]string `json:"fields"` // field_path -> extracted value
	Entities     []string        `json:"entities"`
	Metadata     json.RawMessage `json:"metadata,omitempty"`
	Confidence   float64         `json:"confidence"`
	Timestamp    time.Time       `json:"timestamp"`
}

// Config configures the classifier.
type Config struct {
	// EntityPatterns are regex patterns for entity extraction.
	EntityPatterns []string `json:"entity_patterns"`
	// FieldPatterns map field names to extraction patterns.
	FieldPatterns map[string]string `json:"field_patterns"`
}

// DefaultConfig returns a healthcare/policy-focused configuration.
func DefaultConfig() Config {
	return Config{
		EntityPatterns: []string{
			// Named entities via max entropy patterns
			`\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b`, // Proper names
			`\b\d{3}-\d{2}-\d{4}\b`,                 // SSN pattern
			`\b\d{3}[\.-]?\d{3}[\.-]?\d{4}\b`,       // Phone numbers
			`\b[A-Z]{2,}\b`,                          // Acronyms
		},
		FieldPatterns: map[string]string{
			"patient_name":   `(?i)patient\s*[:]\s*(.+)`,
			"patient_id":     `(?i)(?:patient\s*)?id\s*[:]\s*(\S+)`,
			"diagnosis":      `(?i)diagnosis\s*[:]\s*(.+)`,
			"procedure":      `(?i)procedure\s*[:]\s*(.+)`,
			"date_of_birth":  `(?i)(?:date\s*of\s*)?birth\s*[:]\s*(\S+)`,
			"date_of_service": `(?i)(?:date\s*of\s*)?service\s*[:]\s*(\S+)`,
			"provider":       `(?i)provider\s*[:]\s*(.+)`,
			"policy_number":  `(?i)policy\s*(?:number|#)?\s*[:]\s*(\S+)`,
			"claim_number":   `(?i)claim\s*(?:number|#)?\s*[:]\s*(\S+)`,
			"amount":         `(?i)(?:total\s*)?amount\s*[:]\s*\$?([\d,]+\.?\d*)`,
		},
	}
}

// Service classifies documents and extracts structured fields.
type Service struct {
	config    Config
	entities  []*regexp.Regexp
	fields    map[string]*regexp.Regexp
}

// NewService creates a new classifier service.
func NewService(config Config) (*Service, error) {
	s := &Service{config: config}

	// Compile entity patterns
	for _, p := range config.EntityPatterns {
		re, err := regexp.Compile(p)
		if err != nil {
			return nil, err
		}
		s.entities = append(s.entities, re)
	}

	// Compile field patterns
	s.fields = make(map[string]*regexp.Regexp)
	for name, p := range config.FieldPatterns {
		re, err := regexp.Compile(p)
		if err != nil {
			return nil, err
		}
		s.fields[name] = re
	}

	return s, nil
}

// Classify extracts structured fields and entities from document content.
// This is deterministic — no LLM involved.
func (s *Service) Classify(content string) *Classification {
	result := &Classification{
		Fields:    make(map[string]string),
		Timestamp: time.Now().UTC(),
	}

	// Extract entities
	entitySet := make(map[string]bool)
	for _, re := range s.entities {
		matches := re.FindAllString(content, -1)
		for _, m := range matches {
			m = strings.TrimSpace(m)
			if len(m) > 2 {
				entitySet[m] = true
			}
		}
	}
	for e := range entitySet {
		result.Entities = append(result.Entities, e)
	}

	// Extract fields
	for name, re := range s.fields {
		if match := re.FindStringSubmatch(content); len(match) > 1 {
			result.Fields[name] = strings.TrimSpace(match[1])
		}
	}

	// Compute confidence based on field extraction coverage
	if len(s.fields) > 0 {
		result.Confidence = float64(len(result.Fields)) / float64(len(s.fields))
	} else {
		result.Confidence = 1.0
	}

	// Determine document type from extracted fields
	result.DocumentType = inferDocType(result.Fields)

	return result
}

func inferDocType(fields map[string]string) string {
	if _, ok := fields["diagnosis"]; ok {
		return "medical_record"
	}
	if _, ok := fields["claim_number"]; ok {
		return "insurance_claim"
	}
	if _, ok := fields["policy_number"]; ok {
		return "policy_document"
	}
	if _, ok := fields["procedure"]; ok {
		return "clinical_note"
	}
	return "unknown"
}
