package agent

import "testing"

func TestAssemblePromptDeterministicOrdering(t *testing.T) {
	docs := []ArtifactDoc{
		{Name: "SOUL.md", Content: "alpha"},
		{Name: "RULES.md", Content: "beta"},
		{Name: "DEVPLAN.md", Content: "gamma"},
	}

	got := AssemblePrompt(docs, 0)
	want := "## SOUL.md\nalpha\n\n## RULES.md\nbeta\n\n## DEVPLAN.md\ngamma\n"

	if got != want {
		t.Fatalf("unexpected prompt\nwant:\n%s\ngot:\n%s", want, got)
	}

	gotAgain := AssemblePrompt(docs, 0)
	if gotAgain != got {
		t.Fatalf("prompt assembly is not deterministic")
	}
}

func TestAssemblePromptPerFileTruncation(t *testing.T) {
	docs := []ArtifactDoc{
		{Name: "ONE.md", Content: "1234567890"},
		{Name: "TWO.md", Content: "abcdefghij"},
	}

	got := AssemblePrompt(docs, 4)
	want := "## ONE.md\n1234\n\n## TWO.md\nabcd\n"

	if got != want {
		t.Fatalf("unexpected truncated prompt\nwant:\n%s\ngot:\n%s", want, got)
	}
}
