//go:build !unix

package chatstore

import "time"

func withCrossProcessLock(_ string, _ time.Duration, fn func() error) error {
	if fn == nil {
		return nil
	}
	return fn()
}
