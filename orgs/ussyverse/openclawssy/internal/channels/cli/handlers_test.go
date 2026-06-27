package cli

import (
	"bytes"
	"context"
	"testing"
)

type askCaptureService struct {
	input AskInput
}

func (s *askCaptureService) Ask(_ context.Context, input AskInput) (string, error) {
	s.input = input
	return "ok", nil
}

func TestHandleAskParsesThinkingOverride(t *testing.T) {
	service := &askCaptureService{}
	var out bytes.Buffer
	var errOut bytes.Buffer
	h := Handlers{Ask: service, Out: &out, Err: &errOut}

	code := h.HandleAsk(context.Background(), []string{"-agent", "default", "-message", "hello", "-thinking", "always"})
	if code != 0 {
		t.Fatalf("expected success, got code %d, stderr=%q", code, errOut.String())
	}
	if service.input.ThinkingMode != "always" {
		t.Fatalf("expected thinking mode always, got %q", service.input.ThinkingMode)
	}
}

func TestHandleAskRejectsInvalidThinkingOverride(t *testing.T) {
	service := &askCaptureService{}
	var out bytes.Buffer
	var errOut bytes.Buffer
	h := Handlers{Ask: service, Out: &out, Err: &errOut}

	code := h.HandleAsk(context.Background(), []string{"-message", "hello", "-thinking", "sometimes"})
	if code != 1 {
		t.Fatalf("expected failure code 1, got %d", code)
	}
}
