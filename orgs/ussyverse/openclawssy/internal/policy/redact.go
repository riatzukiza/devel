package policy

import "regexp"

var redactionRules = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*['\"]?[^\s'\"]+`),
	regexp.MustCompile(`(?i)bearer\s+[a-z0-9\-\._~\+/]+=*`),
	regexp.MustCompile(`\b[A-Z][A-Z0-9_]*(TOKEN|KEY|SECRET|PASSWORD)\b\s*=\s*[^\s]+`),
	regexp.MustCompile(`\b[a-zA-Z0-9_\-]{24,}\b`),
}

func RedactString(input string) string {
	out := input
	for _, r := range redactionRules {
		out = r.ReplaceAllString(out, "[REDACTED]")
	}
	return out
}

func RedactValue(v any) any {
	switch t := v.(type) {
	case string:
		return RedactString(t)
	case map[string]any:
		out := make(map[string]any, len(t))
		for k, val := range t {
			out[k] = RedactValue(val)
		}
		return out
	case []any:
		out := make([]any, len(t))
		for i := range t {
			out[i] = RedactValue(t[i])
		}
		return out
	default:
		return v
	}
}
