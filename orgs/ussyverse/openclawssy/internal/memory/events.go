package memory

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func AppendEvent(agentsDir, agentID string, event Event) error {
	agentID = strings.TrimSpace(agentID)
	if !validAgentID(agentID) {
		return fmt.Errorf("%w: %q", ErrInvalidAgentID, agentID)
	}
	event = normalizeEvent(event)
	eventsDir := filepath.Join(agentsDir, agentID, "memory", "events")
	if err := os.MkdirAll(eventsDir, defaultDirMode); err != nil {
		return err
	}
	path := filepath.Join(eventsDir, event.Timestamp.UTC().Format("2006-01-02")+".jsonl")
	f, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, defaultFileMode)
	if err != nil {
		return err
	}
	defer f.Close()

	line, err := json.Marshal(event)
	if err != nil {
		return err
	}
	line = append(line, '\n')
	if _, err := f.Write(line); err != nil {
		return err
	}
	return f.Sync()
}

func ReadEventsSince(agentsDir, agentID string, since time.Time, maxEvents int) ([]Event, error) {
	agentID = strings.TrimSpace(agentID)
	if !validAgentID(agentID) {
		return nil, fmt.Errorf("%w: %q", ErrInvalidAgentID, agentID)
	}
	if maxEvents <= 0 {
		maxEvents = 200
	}
	eventsDir := filepath.Join(agentsDir, agentID, "memory", "events")
	entries, err := os.ReadDir(eventsDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, err
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".jsonl") {
			continue
		}
		files = append(files, filepath.Join(eventsDir, entry.Name()))
	}
	sort.Strings(files)

	out := make([]Event, 0, min(maxEvents, 256))
	for _, path := range files {
		f, err := os.Open(path)
		if err != nil {
			return nil, err
		}
		scanner := bufio.NewScanner(f)
		buf := make([]byte, 0, 64*1024)
		scanner.Buffer(buf, 2*1024*1024)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" {
				continue
			}
			var evt Event
			if err := json.Unmarshal([]byte(line), &evt); err != nil {
				continue
			}
			evt = normalizeEvent(evt)
			if !since.IsZero() && !evt.Timestamp.After(since.UTC()) {
				continue
			}
			out = append(out, evt)
			if len(out) > maxEvents {
				out = out[len(out)-maxEvents:]
			}
		}
		_ = f.Close()
		if err := scanner.Err(); err != nil {
			return nil, err
		}
	}
	return out, nil
}

func WriteCheckpointRecord(agentsDir, agentID string, record CheckpointRecord) (string, error) {
	agentID = strings.TrimSpace(agentID)
	if !validAgentID(agentID) {
		return "", fmt.Errorf("%w: %q", ErrInvalidAgentID, agentID)
	}
	record.AgentID = agentID
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}
	if record.ID == "" {
		record.ID = fmt.Sprintf("chk_%d", record.CreatedAt.UnixNano())
	}
	checkpointsDir := filepath.Join(agentsDir, agentID, "memory", "checkpoints")
	if err := os.MkdirAll(checkpointsDir, defaultDirMode); err != nil {
		return "", err
	}
	checkpointPath := filepath.Join(checkpointsDir, "checkpoint-"+record.CreatedAt.Format("20060102T150405Z")+".json")
	record.CheckpointFilePath = checkpointPath
	raw, err := json.MarshalIndent(record, "", "  ")
	if err != nil {
		return "", err
	}
	raw = append(raw, '\n')
	if err := os.WriteFile(checkpointPath, raw, defaultFileMode); err != nil {
		return "", err
	}
	latestPath := filepath.Join(checkpointsDir, "latest.json")
	if err := os.WriteFile(latestPath, raw, defaultFileMode); err != nil {
		return "", err
	}
	return checkpointPath, nil
}

func LoadLatestCheckpointRecord(agentsDir, agentID string) (CheckpointRecord, bool, error) {
	agentID = strings.TrimSpace(agentID)
	if !validAgentID(agentID) {
		return CheckpointRecord{}, false, fmt.Errorf("%w: %q", ErrInvalidAgentID, agentID)
	}
	latestPath := filepath.Join(agentsDir, agentID, "memory", "checkpoints", "latest.json")
	raw, err := os.ReadFile(latestPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return CheckpointRecord{}, false, nil
		}
		return CheckpointRecord{}, false, err
	}
	var record CheckpointRecord
	if err := json.Unmarshal(raw, &record); err != nil {
		return CheckpointRecord{}, false, err
	}
	return record, true, nil
}

func WriteMaintenanceReport(agentsDir, agentID string, report MaintenanceReport) (string, error) {
	agentID = strings.TrimSpace(agentID)
	if !validAgentID(agentID) {
		return "", fmt.Errorf("%w: %q", ErrInvalidAgentID, agentID)
	}
	report.AgentID = agentID
	if report.CreatedAt.IsZero() {
		report.CreatedAt = time.Now().UTC()
	}
	if strings.TrimSpace(report.ID) == "" {
		report.ID = fmt.Sprintf("maint_%d", report.CreatedAt.UnixNano())
	}
	reportsDir := filepath.Join(agentsDir, agentID, "memory", "reports")
	if err := os.MkdirAll(reportsDir, defaultDirMode); err != nil {
		return "", err
	}
	reportPath := filepath.Join(reportsDir, "maintenance-"+report.CreatedAt.Format("20060102")+".json")
	report.ReportFilePath = reportPath
	raw, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return "", err
	}
	raw = append(raw, '\n')
	if err := os.WriteFile(reportPath, raw, defaultFileMode); err != nil {
		return "", err
	}
	latestPath := filepath.Join(reportsDir, "latest-maintenance.json")
	if err := os.WriteFile(latestPath, raw, defaultFileMode); err != nil {
		return "", err
	}
	return reportPath, nil
}
