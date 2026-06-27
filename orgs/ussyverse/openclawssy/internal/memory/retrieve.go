package memory

import "strings"

const (
	defaultSearchLimit      = 8
	maxSearchLimit          = 50
	defaultMinImportance    = 1
	maxMemoryImportance     = 5
	defaultMemoryStatus     = MemoryStatusActive
	defaultMemoryKind       = "note"
	defaultMemoryConfidence = 0.7
)

func NormalizeSearchParams(params SearchParams) SearchParams {
	params.Query = strings.TrimSpace(params.Query)
	if params.Limit <= 0 {
		params.Limit = defaultSearchLimit
	}
	if params.Limit > maxSearchLimit {
		params.Limit = maxSearchLimit
	}
	if params.MinImportance <= 0 {
		params.MinImportance = defaultMinImportance
	}
	if params.MinImportance > maxMemoryImportance {
		params.MinImportance = maxMemoryImportance
	}
	params.Status = normalizeStatus(params.Status)
	return params
}

func NormalizeItem(item MemoryItem) MemoryItem {
	item.ID = strings.TrimSpace(item.ID)
	item.AgentID = strings.TrimSpace(item.AgentID)
	item.Kind = strings.TrimSpace(item.Kind)
	if item.Kind == "" {
		item.Kind = defaultMemoryKind
	}
	item.Title = strings.TrimSpace(item.Title)
	item.Content = strings.TrimSpace(item.Content)
	if item.Importance <= 0 {
		item.Importance = defaultMinImportance
	}
	if item.Importance > maxMemoryImportance {
		item.Importance = maxMemoryImportance
	}
	if item.Confidence <= 0 {
		item.Confidence = defaultMemoryConfidence
	}
	if item.Confidence > 1 {
		item.Confidence = 1
	}
	item.Status = normalizeStatus(item.Status)
	return item
}

func normalizeStatus(status string) string {
	value := strings.ToLower(strings.TrimSpace(status))
	switch value {
	case MemoryStatusActive, MemoryStatusForgotten, MemoryStatusArchived:
		return value
	default:
		return defaultMemoryStatus
	}
}
