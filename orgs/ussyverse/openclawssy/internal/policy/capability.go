package policy

import (
	"fmt"
	"sort"
	"strings"
	"sync"

	"openclawssy/internal/toolparse"
)

type CapabilityError struct {
	AgentID string
	Tool    string
}

func (e *CapabilityError) Error() string {
	return fmt.Sprintf("capability denied: agent=%q tool=%q", e.AgentID, e.Tool)
}

type PathError struct {
	Path   string
	Reason string
}

func (e *PathError) Error() string {
	return fmt.Sprintf("path denied: %s (%s)", e.Path, e.Reason)
}

type Enforcer struct {
	Workspace    string
	Capabilities map[string]map[string]bool
	mu           sync.RWMutex
}

func NewEnforcer(workspace string, grants map[string][]string) *Enforcer {
	m := make(map[string]map[string]bool, len(grants))
	for agent, tools := range grants {
		set := make(map[string]bool, len(tools))
		for _, tool := range tools {
			canonical := canonicalCapabilityTool(tool)
			if canonical == "" {
				continue
			}
			set[canonical] = true
		}
		m[agent] = set
	}

	return &Enforcer{Workspace: workspace, Capabilities: m}
}

func (e *Enforcer) CheckTool(agentID, tool string) error {
	canonical := canonicalCapabilityTool(tool)
	e.mu.RLock()
	defer e.mu.RUnlock()
	agentCaps, ok := e.Capabilities[agentID]
	if !ok {
		return &CapabilityError{AgentID: agentID, Tool: canonical}
	}
	if !agentCaps[canonical] {
		return &CapabilityError{AgentID: agentID, Tool: canonical}
	}
	return nil
}

func (e *Enforcer) HasCapability(agentID, capability string) bool {
	canonical := canonicalCapabilityTool(capability)
	if canonical == "" {
		return false
	}
	e.mu.RLock()
	defer e.mu.RUnlock()
	agentCaps, ok := e.Capabilities[agentID]
	if !ok {
		return false
	}
	return agentCaps[canonical]
}

func (e *Enforcer) SetCapabilities(agentID string, capabilities []string) {
	if strings.TrimSpace(agentID) == "" {
		return
	}
	set := make(map[string]bool, len(capabilities))
	for _, cap := range capabilities {
		canonical := canonicalCapabilityTool(cap)
		if canonical == "" {
			continue
		}
		set[canonical] = true
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.Capabilities == nil {
		e.Capabilities = map[string]map[string]bool{}
	}
	e.Capabilities[agentID] = set
}

func (e *Enforcer) ListCapabilities(agentID string) []string {
	e.mu.RLock()
	defer e.mu.RUnlock()
	agentCaps, ok := e.Capabilities[agentID]
	if !ok {
		return nil
	}
	out := make([]string, 0, len(agentCaps))
	for cap, granted := range agentCaps {
		if granted {
			out = append(out, cap)
		}
	}
	sort.Strings(out)
	return out
}

func CanonicalCapability(tool string) string {
	return canonicalCapabilityTool(tool)
}

func canonicalCapabilityTool(tool string) string {
	candidate := strings.TrimSpace(tool)
	if candidate == "" {
		return ""
	}
	if canonical, ok := toolparse.CanonicalToolName(candidate); ok {
		return canonical
	}
	return strings.ToLower(candidate)
}
