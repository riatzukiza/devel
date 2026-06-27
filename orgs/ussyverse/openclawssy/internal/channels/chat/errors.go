package chat

import (
	"fmt"
	"strings"
	"time"
)

type RateLimitError struct {
	Scope             string
	RetryAfterSeconds int
	RetryAfterDur     time.Duration
}

func NewRateLimitError(scope string, retryAfter time.Duration) *RateLimitError {
	if retryAfter < time.Millisecond {
		retryAfter = time.Millisecond
	}
	seconds := int(retryAfter / time.Second)
	if retryAfter%time.Second != 0 {
		seconds++
	}
	if seconds < 1 {
		seconds = 1
	}
	return &RateLimitError{Scope: strings.TrimSpace(scope), RetryAfterSeconds: seconds, RetryAfterDur: retryAfter}
}

func (e *RateLimitError) Error() string {
	if e == nil {
		return ErrRateLimited.Error()
	}
	scope := strings.TrimSpace(e.Scope)
	if scope == "" {
		scope = "sender"
	}
	if e.RetryAfterSeconds > 0 {
		return fmt.Sprintf("chat %s is rate limited; retry in %ds", scope, e.RetryAfterSeconds)
	}
	return fmt.Sprintf("chat %s is rate limited", scope)
}

func (e *RateLimitError) Unwrap() error {
	return ErrRateLimited
}

func (e *RateLimitError) RetryAfter() time.Duration {
	if e == nil {
		return 0
	}
	if e.RetryAfterDur > 0 {
		return e.RetryAfterDur
	}
	if e.RetryAfterSeconds > 0 {
		return time.Duration(e.RetryAfterSeconds) * time.Second
	}
	return 0
}
