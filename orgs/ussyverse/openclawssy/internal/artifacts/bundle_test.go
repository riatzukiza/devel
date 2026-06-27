package artifacts

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestWriteRunBundleWritesExpectedFiles(t *testing.T) {
	root := t.TempDir()

	runDir, err := WriteRunBundle(
		root,
		"agent-1",
		"run-1",
		map[string]any{"message": "hi"},
		map[string]any{"final_text": "hello"},
		[]map[string]any{{"name": "time.now", "output": "ok"}},
		map[string]any{"duration_ms": 10},
	)
	if err != nil {
		t.Fatalf("WriteRunBundle failed: %v", err)
	}

	wantDir := filepath.Join(root, ".openclawssy", "agents", "agent-1", "runs", "run-1")
	if runDir != wantDir {
		t.Fatalf("unexpected run dir\nwant: %s\ngot:  %s", wantDir, runDir)
	}

	files := []string{"input.json", "output.json", "tool_calls.json", "meta.json"}
	for _, name := range files {
		path := filepath.Join(runDir, name)
		data, readErr := os.ReadFile(path)
		if readErr != nil {
			t.Fatalf("missing %s: %v", name, readErr)
		}

		var v any
		if unmarshalErr := json.Unmarshal(data, &v); unmarshalErr != nil {
			t.Fatalf("invalid json in %s: %v", name, unmarshalErr)
		}
	}
}

func TestWriteRunBundleV1WritesExpectedFiles(t *testing.T) {
	root := t.TempDir()
	runDir, err := WriteRunBundleV1(root, "agent-1", "run-2", BundleV1Input{
		Input:     map[string]any{"message": "hi"},
		PromptMD:  "# prompt",
		ToolCalls: []string{`{"id":"1"}`},
		OutputMD:  "done",
		Meta:      map[string]any{"duration_ms": 5},
	})
	if err != nil {
		t.Fatalf("WriteRunBundleV1 failed: %v", err)
	}

	files := []string{"input.json", "prompt.md", "toolcalls.jsonl", "output.md", "meta.json"}
	for _, name := range files {
		if _, err := os.Stat(filepath.Join(runDir, name)); err != nil {
			t.Fatalf("missing %s: %v", name, err)
		}
	}
}
