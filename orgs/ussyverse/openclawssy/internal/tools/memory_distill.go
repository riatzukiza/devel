package tools

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"openclawssy/internal/config"
	"openclawssy/internal/memory"
)

const checkpointDistillMaxEvents = 200

type checkpointDistillResult struct {
	NewItems []checkpointNewItem `json:"new_items"`
	Updates  []checkpointUpdate  `json:"updates"`
}

type checkpointNewItem struct {
	Kind       string  `json:"kind"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Importance int     `json:"importance"`
	Confidence float64 `json:"confidence"`
}

type checkpointUpdate struct {
	ID         string  `json:"id"`
	NewContent string  `json:"new_content"`
	Confidence float64 `json:"confidence"`
}

func distillCheckpointWithModel(ctx context.Context, cfg config.Config, events []memory.Event) (checkpointDistillResult, error) {
	provider := strings.ToLower(strings.TrimSpace(cfg.Model.Provider))
	endpoint, err := resolveProviderEndpoint(cfg, provider)
	if err != nil {
		return checkpointDistillResult{}, err
	}
	apiKey, err := resolveProviderAPIKey(endpoint)
	if err != nil {
		return checkpointDistillResult{}, err
	}
	prompt := buildCheckpointPrompt(events)
	body := map[string]any{
		"model": cfg.Model.Name,
		"messages": []map[string]string{
			{"role": "system", "content": checkpointSystemPrompt},
			{"role": "user", "content": prompt},
		},
		"max_tokens": 1600,
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return checkpointDistillResult{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(endpoint.BaseURL, "/")+"/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return checkpointDistillResult{}, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")
	for k, v := range endpoint.Headers {
		httpReq.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 45 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return checkpointDistillResult{}, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return checkpointDistillResult{}, err
	}
	if resp.StatusCode >= 300 {
		return checkpointDistillResult{}, fmt.Errorf("model distillation failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	var payload struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &payload); err != nil {
		return checkpointDistillResult{}, err
	}
	if len(payload.Choices) == 0 {
		return checkpointDistillResult{}, errors.New("model distillation returned no choices")
	}
	return parseStrictCheckpointJSON(payload.Choices[0].Message.Content)
}

func parseStrictCheckpointJSON(raw string) (checkpointDistillResult, error) {
	jsonText := extractJSONObject(raw)
	if jsonText == "" {
		return checkpointDistillResult{}, errors.New("checkpoint distillation missing JSON object")
	}
	dec := json.NewDecoder(strings.NewReader(jsonText))
	dec.DisallowUnknownFields()
	var out checkpointDistillResult
	if err := dec.Decode(&out); err != nil {
		return checkpointDistillResult{}, fmt.Errorf("invalid distillation JSON: %w", err)
	}
	if out.NewItems == nil {
		out.NewItems = []checkpointNewItem{}
	}
	if out.Updates == nil {
		out.Updates = []checkpointUpdate{}
	}
	if len(out.NewItems) > 200 || len(out.Updates) > 200 {
		return checkpointDistillResult{}, errors.New("distillation output too large")
	}
	for i, item := range out.NewItems {
		item.Kind = strings.TrimSpace(item.Kind)
		item.Title = strings.TrimSpace(item.Title)
		item.Content = strings.TrimSpace(item.Content)
		if item.Kind == "" || item.Title == "" || item.Content == "" {
			return checkpointDistillResult{}, fmt.Errorf("new_items[%d] requires kind/title/content", i)
		}
		if item.Importance < 1 || item.Importance > 5 {
			return checkpointDistillResult{}, fmt.Errorf("new_items[%d].importance must be 1..5", i)
		}
		if item.Confidence < 0 || item.Confidence > 1 {
			return checkpointDistillResult{}, fmt.Errorf("new_items[%d].confidence must be 0..1", i)
		}
		out.NewItems[i] = item
	}
	for i, upd := range out.Updates {
		upd.ID = strings.TrimSpace(upd.ID)
		upd.NewContent = strings.TrimSpace(upd.NewContent)
		if upd.ID == "" || upd.NewContent == "" {
			return checkpointDistillResult{}, fmt.Errorf("updates[%d] requires id/new_content", i)
		}
		if upd.Confidence < 0 || upd.Confidence > 1 {
			return checkpointDistillResult{}, fmt.Errorf("updates[%d].confidence must be 0..1", i)
		}
		out.Updates[i] = upd
	}
	return out, nil
}

func extractJSONObject(raw string) string {
	text := strings.TrimSpace(raw)
	if text == "" {
		return ""
	}
	if strings.HasPrefix(text, "```") {
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimPrefix(text, "```")
		text = strings.TrimSuffix(text, "```")
		text = strings.TrimSpace(text)
	}
	start := strings.Index(text, "{")
	if start < 0 {
		return ""
	}
	depth := 0
	inString := false
	escaped := false
	for i := start; i < len(text); i++ {
		ch := text[i]
		if inString {
			if escaped {
				escaped = false
				continue
			}
			if ch == '\\' {
				escaped = true
				continue
			}
			if ch == '"' {
				inString = false
			}
			continue
		}
		switch ch {
		case '"':
			inString = true
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return text[start : i+1]
			}
		}
	}
	return ""
}

func buildCheckpointPrompt(events []memory.Event) string {
	trimmed := events
	if len(trimmed) > checkpointDistillMaxEvents {
		trimmed = trimmed[len(trimmed)-checkpointDistillMaxEvents:]
	}
	raw, _ := json.Marshal(trimmed)
	return "Distill the following memory events into strict JSON with keys new_items and updates only.\nEvents JSON:\n" + string(raw)
}

const checkpointSystemPrompt = "You are a memory distillation engine. Return exactly one JSON object with this schema: {\"new_items\":[{\"kind\":string,\"title\":string,\"content\":string,\"importance\":1..5,\"confidence\":0..1}],\"updates\":[{\"id\":string,\"new_content\":string,\"confidence\":0..1}]}. Do not include markdown or commentary."
