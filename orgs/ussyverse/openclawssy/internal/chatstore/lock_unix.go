//go:build unix

package chatstore

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"
)

func withCrossProcessLock(lockPath string, timeout time.Duration, fn func() error) error {
	if fn == nil {
		return nil
	}
	if timeout <= 0 {
		timeout = lockAcquireTimeout
	}
	if err := os.MkdirAll(filepath.Dir(lockPath), 0o755); err != nil {
		return fmt.Errorf("chatstore: create lock dir: %w", err)
	}

	f, err := os.OpenFile(lockPath, os.O_CREATE|os.O_RDWR, 0o600)
	if err != nil {
		return fmt.Errorf("chatstore: open lock file: %w", err)
	}
	defer f.Close()

	deadline := time.Now().Add(timeout)
	for {
		if err := syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); err == nil {
			break
		} else if !errors.Is(err, syscall.EWOULDBLOCK) && !errors.Is(err, syscall.EAGAIN) {
			return fmt.Errorf("chatstore: lock file: %w", err)
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("chatstore: lock timeout for %s", lockPath)
		}
		time.Sleep(10 * time.Millisecond)
	}
	defer func() {
		_ = syscall.Flock(int(f.Fd()), syscall.LOCK_UN)
	}()

	return fn()
}
