package chat

import (
	"sync"
	"time"
)

type RateLimiter struct {
	mu     sync.Mutex
	limit  int
	window time.Duration
	now    func() time.Time
	events map[string][]time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return NewRateLimiterWithClock(limit, window, time.Now)
}

func NewRateLimiterWithClock(limit int, window time.Duration, now func() time.Time) *RateLimiter {
	if limit < 1 {
		limit = 1
	}
	if window <= 0 {
		window = time.Second
	}
	if now == nil {
		now = time.Now
	}

	return &RateLimiter{
		limit:  limit,
		window: window,
		now:    now,
		events: make(map[string][]time.Time),
	}
}

func (r *RateLimiter) Allow(key string) bool {
	allowed, _ := r.AllowWithDetails(key)
	return allowed
}

func (r *RateLimiter) AllowWithDetails(key string) (bool, time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := r.now()
	cutoff := now.Add(-r.window)

	events := r.events[key]
	kept := events[:0]
	for _, ts := range events {
		if ts.After(cutoff) {
			kept = append(kept, ts)
		}
	}

	if len(kept) >= r.limit {
		r.events[key] = kept
		retryAfter := kept[0].Add(r.window).Sub(now)
		if retryAfter < time.Millisecond {
			retryAfter = time.Millisecond
		}
		return false, retryAfter
	}

	kept = append(kept, now)
	r.events[key] = kept
	return true, 0
}
