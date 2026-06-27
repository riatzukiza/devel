package memory

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const (
	defaultDirMode         = 0o755
	defaultFileMode        = 0o600
	defaultEventBufferSize = 256
)

var (
	ErrQueueFull      = errors.New("memory: event queue full")
	ErrManagerClosed  = errors.New("memory: manager closed")
	ErrInvalidAgentID = errors.New("memory: invalid agent id")
)

type Manager struct {
	enabled bool

	eventsDir string
	queue     chan Event

	closeOnce sync.Once
	done      chan struct{}
	closeErr  atomic.Pointer[error]
	dropped   atomic.Uint64
}

func NewManager(agentsDir, agentID string, opts Options) (*Manager, error) {
	agentID = strings.TrimSpace(agentID)
	if !validAgentID(agentID) {
		return nil, fmt.Errorf("%w: %q", ErrInvalidAgentID, agentID)
	}

	if !opts.Enabled {
		return &Manager{enabled: false}, nil
	}

	bufferSize := opts.BufferSize
	if bufferSize <= 0 {
		bufferSize = defaultEventBufferSize
	}

	eventsDir := filepath.Join(agentsDir, agentID, "memory", "events")
	if err := os.MkdirAll(eventsDir, defaultDirMode); err != nil {
		return nil, fmt.Errorf("memory: create events dir: %w", err)
	}

	mgr := &Manager{
		enabled:   true,
		eventsDir: eventsDir,
		queue:     make(chan Event, bufferSize),
		done:      make(chan struct{}),
	}
	go mgr.runWriter()
	return mgr, nil
}

func (m *Manager) IngestEvent(ctx context.Context, event Event) error {
	_ = ctx
	if m == nil || !m.enabled {
		return nil
	}
	select {
	case <-m.done:
		return ErrManagerClosed
	default:
	}

	event = normalizeEvent(event)

	select {
	case m.queue <- event:
		return nil
	default:
		m.dropped.Add(1)
		return ErrQueueFull
	}
}

func (m *Manager) Stats() Stats {
	if m == nil {
		return Stats{}
	}
	return Stats{DroppedEvents: m.dropped.Load()}
}

func (m *Manager) Close() error {
	if m == nil || !m.enabled {
		return nil
	}

	m.closeOnce.Do(func() {
		close(m.queue)
		<-m.done
	})

	if ptr := m.closeErr.Load(); ptr != nil {
		return *ptr
	}
	return nil
}

func (m *Manager) runWriter() {
	defer close(m.done)

	var (
		currentDay string
		file       *os.File
		writer     *bufio.Writer
	)
	closeFile := func() error {
		if writer != nil {
			if err := writer.Flush(); err != nil {
				return err
			}
		}
		if file != nil {
			if err := file.Sync(); err != nil {
				_ = file.Close()
				return err
			}
			if err := file.Close(); err != nil {
				return err
			}
		}
		writer = nil
		file = nil
		currentDay = ""
		return nil
	}

	setCloseErr := func(err error) {
		if err == nil {
			return
		}
		if m.closeErr.Load() != nil {
			return
		}
		errCopy := err
		m.closeErr.Store(&errCopy)
	}

	for event := range m.queue {
		dayKey := event.Timestamp.UTC().Format("2006-01-02")
		if dayKey == "" {
			dayKey = time.Now().UTC().Format("2006-01-02")
		}
		if currentDay != dayKey {
			if err := closeFile(); err != nil {
				setCloseErr(err)
			}
			path := filepath.Join(m.eventsDir, dayKey+".jsonl")
			f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, defaultFileMode)
			if err != nil {
				setCloseErr(err)
				continue
			}
			file = f
			writer = bufio.NewWriterSize(file, 32*1024)
			currentDay = dayKey
		}

		line, err := json.Marshal(event)
		if err != nil {
			setCloseErr(err)
			continue
		}
		line = append(line, '\n')

		if _, err := writer.Write(line); err != nil {
			setCloseErr(err)
			continue
		}
		if err := writer.Flush(); err != nil {
			setCloseErr(err)
			continue
		}
	}

	if err := closeFile(); err != nil {
		setCloseErr(err)
	}
}

func normalizeEvent(event Event) Event {
	if strings.TrimSpace(event.ID) == "" {
		event.ID = fmt.Sprintf("evt_%d", time.Now().UTC().UnixNano())
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	} else {
		event.Timestamp = event.Timestamp.UTC()
	}
	event.Type = strings.TrimSpace(event.Type)
	event.Text = strings.TrimSpace(event.Text)
	event.SessionID = strings.TrimSpace(event.SessionID)
	event.RunID = strings.TrimSpace(event.RunID)
	if len(event.Metadata) == 0 {
		event.Metadata = nil
	}
	return event
}

func validAgentID(agentID string) bool {
	if agentID == "" {
		return false
	}
	if strings.Contains(agentID, "..") {
		return false
	}
	if strings.ContainsRune(agentID, '/') || strings.ContainsRune(agentID, '\\') {
		return false
	}
	return true
}
