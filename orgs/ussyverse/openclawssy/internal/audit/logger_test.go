package audit

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestLoggerAppendOnly(t *testing.T) {
	path := filepath.Join(t.TempDir(), "audit.jsonl")

	logger, err := NewLogger(path, nil)
	if err != nil {
		t.Fatalf("new logger: %v", err)
	}

	if err := logger.LogEvent(context.Background(), EventRunStart, map[string]any{"run_id": "r1"}); err != nil {
		t.Fatalf("log 1: %v", err)
	}
	if err := logger.LogEvent(context.Background(), EventRunEnd, map[string]any{"run_id": "r1"}); err != nil {
		t.Fatalf("log 2: %v", err)
	}
	if err := logger.Close(); err != nil {
		t.Fatalf("close logger: %v", err)
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read file: %v", err)
	}
	lines := strings.Split(strings.TrimSpace(string(raw)), "\n")
	if len(lines) != 2 {
		t.Fatalf("expected 2 lines, got %d", len(lines))
	}
}

func TestLoggerRedactsPayload(t *testing.T) {
	path := filepath.Join(t.TempDir(), "audit.jsonl")
	redact := func(v any) any {
		m, ok := v.(map[string]any)
		if !ok {
			return v
		}
		out := map[string]any{}
		for k, val := range m {
			if _, ok := val.(string); ok && strings.Contains(strings.ToLower(k), "token") {
				out[k] = "[REDACTED]"
				continue
			}
			out[k] = val
		}
		return out
	}

	logger, err := NewLogger(path, redact)
	if err != nil {
		t.Fatalf("new logger: %v", err)
	}

	err = logger.LogEvent(context.Background(), EventToolCall, map[string]any{
		"tool":         "fs.read",
		"api_token":    "super-secret-token",
		"safe_message": "ok",
	})
	if err != nil {
		t.Fatalf("log event: %v", err)
	}
	if err := logger.Close(); err != nil {
		t.Fatalf("close logger: %v", err)
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read audit: %v", err)
	}

	line := strings.TrimSpace(string(raw))
	var evt Event
	if err := json.Unmarshal([]byte(line), &evt); err != nil {
		t.Fatalf("unmarshal event: %v", err)
	}

	if evt.Payload["api_token"] != "[REDACTED]" {
		t.Fatalf("expected redacted token payload, got %#v", evt.Payload["api_token"])
	}
}

func TestLoggerPeriodicFlush(t *testing.T) {
	path := filepath.Join(t.TempDir(), "audit.jsonl")
	logger, err := newLoggerWithFlushInterval(path, nil, 5*time.Millisecond)
	if err != nil {
		t.Fatalf("new logger: %v", err)
	}

	if err := logger.LogEvent(context.Background(), EventToolCall, map[string]any{"tool": "fs.list"}); err != nil {
		t.Fatalf("log first event: %v", err)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read audit before flush: %v", err)
	}
	if strings.TrimSpace(string(raw)) != "" {
		t.Fatalf("expected no flushed data yet, got %q", string(raw))
	}

	time.Sleep(10 * time.Millisecond)
	if err := logger.LogEvent(context.Background(), EventToolResult, map[string]any{"tool": "fs.list"}); err != nil {
		t.Fatalf("log second event: %v", err)
	}
	if err := logger.Close(); err != nil {
		t.Fatalf("close logger: %v", err)
	}

	raw, err = os.ReadFile(path)
	if err != nil {
		t.Fatalf("read audit after periodic flush: %v", err)
	}
	lines := strings.Split(strings.TrimSpace(string(raw)), "\n")
	if len(lines) != 2 {
		t.Fatalf("expected 2 lines after periodic flush, got %d", len(lines))
	}
}
