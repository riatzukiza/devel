package chat

import "strings"

type Allowlist struct {
	users map[string]struct{}
	rooms map[string]struct{}
}

func NewAllowlist(userIDs, roomIDs []string) *Allowlist {
	a := &Allowlist{
		users: make(map[string]struct{}, len(userIDs)),
		rooms: make(map[string]struct{}, len(roomIDs)),
	}
	for _, id := range userIDs {
		id = normalizeAllowlistID(id)
		if id != "" {
			a.users[id] = struct{}{}
		}
	}
	for _, id := range roomIDs {
		id = normalizeAllowlistID(id)
		if id != "" {
			a.rooms[id] = struct{}{}
		}
	}
	return a
}

func (a *Allowlist) UserAllowed(userID string) bool {
	if len(a.users) == 0 {
		return false
	}
	_, ok := a.users[normalizeAllowlistID(userID)]
	return ok
}

func (a *Allowlist) RoomAllowed(roomID string) bool {
	if len(a.rooms) == 0 {
		return true
	}
	_, ok := a.rooms[normalizeAllowlistID(roomID)]
	return ok
}

func (a *Allowlist) MessageAllowed(userID, roomID string) bool {
	return a.UserAllowed(userID) && a.RoomAllowed(roomID)
}

func normalizeAllowlistID(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
