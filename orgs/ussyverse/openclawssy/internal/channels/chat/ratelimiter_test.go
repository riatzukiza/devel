package chat

import (
	"testing"
	"time"
)

func TestRateLimiter_AllowWithinLimit(t *testing.T) {
	now := time.Date(2026, 2, 15, 10, 0, 0, 0, time.UTC)
	clock := func() time.Time { return now }
	rl := NewRateLimiterWithClock(2, time.Second, clock)

	if !rl.Allow("u1") {
		t.Fatal("first request should pass")
	}
	if !rl.Allow("u1") {
		t.Fatal("second request should pass")
	}
	if rl.Allow("u1") {
		t.Fatal("third request should be rate limited")
	}

	now = now.Add(1100 * time.Millisecond)
	if !rl.Allow("u1") {
		t.Fatal("request should pass after window elapsed")
	}
}

func TestRateLimiter_PerKeyIsolation(t *testing.T) {
	now := time.Date(2026, 2, 15, 10, 0, 0, 0, time.UTC)
	clock := func() time.Time { return now }
	rl := NewRateLimiterWithClock(1, time.Second, clock)

	if !rl.Allow("u1") {
		t.Fatal("u1 first request should pass")
	}
	if rl.Allow("u1") {
		t.Fatal("u1 second request should be blocked")
	}
	if !rl.Allow("u2") {
		t.Fatal("u2 should have independent quota")
	}
}

func TestRateLimiter_AllowWithDetailsIncludesRetryAfter(t *testing.T) {
	now := time.Date(2026, 2, 15, 10, 0, 0, 0, time.UTC)
	clock := func() time.Time { return now }
	rl := NewRateLimiterWithClock(1, 5*time.Second, clock)

	allowed, retryAfter := rl.AllowWithDetails("u1")
	if !allowed || retryAfter != 0 {
		t.Fatalf("expected first request allowed with zero retryAfter, got allowed=%v retryAfter=%s", allowed, retryAfter)
	}

	now = now.Add(1200 * time.Millisecond)
	allowed, retryAfter = rl.AllowWithDetails("u1")
	if allowed {
		t.Fatal("expected second request blocked")
	}
	if retryAfter < 3700*time.Millisecond || retryAfter > 3900*time.Millisecond {
		t.Fatalf("unexpected retryAfter window: %s", retryAfter)
	}
}
