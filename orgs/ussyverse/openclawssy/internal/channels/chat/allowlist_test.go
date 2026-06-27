package chat

import "testing"

func TestAllowlist_MessageAllowed(t *testing.T) {
	a := NewAllowlist([]string{"u1", "u2"}, []string{"room-a"})

	if !a.MessageAllowed("u1", "room-a") {
		t.Fatal("expected allowlisted user and room to pass")
	}
	if a.MessageAllowed("u9", "room-a") {
		t.Fatal("expected non-allowlisted user to fail")
	}
	if a.MessageAllowed("u1", "room-z") {
		t.Fatal("expected non-allowlisted room to fail")
	}
}

func TestAllowlist_RoomOptional(t *testing.T) {
	a := NewAllowlist([]string{"u1"}, nil)

	if !a.MessageAllowed("u1", "") {
		t.Fatal("expected allowlisted user to pass when room allowlist is empty")
	}
	if a.MessageAllowed("u2", "") {
		t.Fatal("expected non-allowlisted user to fail")
	}
}

func TestAllowlist_EmptyUsersDenyByDefault(t *testing.T) {
	a := NewAllowlist(nil, nil)
	if a.MessageAllowed("u1", "room-a") {
		t.Fatal("expected deny-by-default when user allowlist is empty")
	}
}

func TestAllowlist_NormalizesCaseAndWhitespace(t *testing.T) {
	a := NewAllowlist([]string{" DASHBOARD_USER "}, []string{" DASHBOARD "})

	if !a.MessageAllowed("dashboard_user", "dashboard") {
		t.Fatal("expected lowercase sender IDs to match upper/whitespace allowlist entries")
	}
	if !a.MessageAllowed("DASHBOARD_USER", "DASHBOARD") {
		t.Fatal("expected uppercase sender IDs to match normalized allowlist entries")
	}
}
