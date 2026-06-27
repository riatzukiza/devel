package tools

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"openclawssy/internal/config"
	"openclawssy/internal/memory"
	memorystore "openclawssy/internal/memory/store"
)

func registerMemoryTools(reg *Registry, agentsPath, configPath string) error {
	if err := reg.Register(ToolSpec{
		Name:        "memory.search",
		Description: "Search working memory items",
		ArgTypes: map[string]ArgType{
			"query":          ArgTypeString,
			"limit":          ArgTypeNumber,
			"min_importance": ArgTypeNumber,
			"status":         ArgTypeString,
		},
	}, memorySearch(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "memory.write",
		Description: "Write a working memory item",
		Required:    []string{"kind", "title", "content"},
		ArgTypes: map[string]ArgType{
			"kind":       ArgTypeString,
			"title":      ArgTypeString,
			"content":    ArgTypeString,
			"importance": ArgTypeNumber,
			"confidence": ArgTypeNumber,
			"status":     ArgTypeString,
		},
	}, memoryWrite(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "memory.update",
		Description: "Update an existing working memory item",
		Required:    []string{"id"},
		ArgTypes: map[string]ArgType{
			"id":         ArgTypeString,
			"kind":       ArgTypeString,
			"title":      ArgTypeString,
			"content":    ArgTypeString,
			"importance": ArgTypeNumber,
			"confidence": ArgTypeNumber,
			"status":     ArgTypeString,
		},
	}, memoryUpdate(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "memory.forget",
		Description: "Forget memory item by ID",
		Required:    []string{"id"},
		ArgTypes: map[string]ArgType{
			"id": ArgTypeString,
		},
	}, memoryForget(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "memory.health",
		Description: "Get memory store health and stats",
	}, memoryHealth(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "decision.log",
		Description: "Log a structured decision into memory",
		Required:    []string{"title", "content"},
		ArgTypes: map[string]ArgType{
			"title":      ArgTypeString,
			"content":    ArgTypeString,
			"importance": ArgTypeNumber,
			"confidence": ArgTypeNumber,
			"metadata":   ArgTypeObject,
		},
	}, decisionLog(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "memory.checkpoint",
		Description: "Distill recent events into memory items",
		ArgTypes: map[string]ArgType{
			"max_events": ArgTypeNumber,
		},
	}, memoryCheckpoint(agentsPath, configPath)); err != nil {
		return err
	}
	if err := reg.Register(ToolSpec{
		Name:        "memory.maintenance",
		Description: "Run weekly memory maintenance and report",
		ArgTypes: map[string]ArgType{
			"stale_days": ArgTypeNumber,
			"dry_run":    ArgTypeBool,
		},
	}, memoryMaintenance(agentsPath, configPath)); err != nil {
		return err
	}
	return nil
}

func memorySearch(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		cfg, err := loadMemoryConfigForRequest(req.Workspace, configPath)
		if err != nil {
			return nil, err
		}
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()

		params := memory.SearchParams{
			Query:         strings.TrimSpace(valueString(req.Args, "query")),
			Limit:         getIntArg(req.Args, "limit", 8),
			MinImportance: getIntArg(req.Args, "min_importance", 1),
			Status:        strings.TrimSpace(valueString(req.Args, "status")),
		}
		items, err := store.Search(ctx, params)
		if err != nil {
			return nil, err
		}
		mode := "fts"
		if cfg.Memory.EmbeddingsEnabled && strings.TrimSpace(params.Query) != "" {
			embedded, embedMode := semanticRecallWithEmbedding(ctx, cfg, store, params)
			if len(embedded) > 0 {
				items = mergeMemoryItems(embedded, items, memory.NormalizeSearchParams(params).Limit)
				mode = embedMode
			}
		}
		return map[string]any{
			"items":  items,
			"count":  len(items),
			"query":  params.Query,
			"limit":  memory.NormalizeSearchParams(params).Limit,
			"status": memory.NormalizeSearchParams(params).Status,
			"mode":   mode,
		}, nil
	}
}

func memoryWrite(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		cfg, err := loadMemoryConfigForRequest(req.Workspace, configPath)
		if err != nil {
			return nil, err
		}
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()

		item := memory.MemoryItem{
			Kind:       strings.TrimSpace(valueString(req.Args, "kind")),
			Title:      strings.TrimSpace(valueString(req.Args, "title")),
			Content:    strings.TrimSpace(valueString(req.Args, "content")),
			Importance: getIntArg(req.Args, "importance", 3),
			Confidence: getFloatArg(req.Args, "confidence", 0.85),
			Status:     strings.TrimSpace(valueString(req.Args, "status")),
		}
		if item.Kind == "" || item.Title == "" || item.Content == "" {
			return nil, errors.New("kind, title, and content are required")
		}
		saved, err := store.Upsert(ctx, item)
		if err != nil {
			return nil, err
		}
		_ = maybeSyncMemoryEmbedding(ctx, cfg, store, saved)
		return map[string]any{"item": saved, "written": true}, nil
	}
}

func memoryUpdate(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		cfg, err := loadMemoryConfigForRequest(req.Workspace, configPath)
		if err != nil {
			return nil, err
		}
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()

		id := strings.TrimSpace(valueString(req.Args, "id"))
		item := memory.MemoryItem{ID: id}
		if item.ID == "" {
			return nil, errors.New("id is required")
		}
		existing, found, err := store.Get(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		if !found {
			return map[string]any{"id": item.ID, "updated": false, "found": false}, nil
		}
		item = existing
		if _, ok := req.Args["kind"]; ok {
			item.Kind = strings.TrimSpace(valueString(req.Args, "kind"))
		}
		if _, ok := req.Args["title"]; ok {
			item.Title = strings.TrimSpace(valueString(req.Args, "title"))
		}
		if _, ok := req.Args["content"]; ok {
			item.Content = strings.TrimSpace(valueString(req.Args, "content"))
		}
		if _, ok := req.Args["importance"]; ok {
			item.Importance = getIntArg(req.Args, "importance", item.Importance)
		}
		if _, ok := req.Args["confidence"]; ok {
			item.Confidence = getFloatArg(req.Args, "confidence", item.Confidence)
		}
		if _, ok := req.Args["status"]; ok {
			item.Status = strings.TrimSpace(valueString(req.Args, "status"))
		}
		if strings.TrimSpace(item.Kind) == "" || strings.TrimSpace(item.Title) == "" || strings.TrimSpace(item.Content) == "" {
			return nil, errors.New("kind, title, and content cannot be empty")
		}
		saved, err := store.Update(ctx, item)
		if err != nil {
			if errors.Is(err, memorystore.ErrNotFound) {
				return map[string]any{"id": item.ID, "updated": false, "found": false}, nil
			}
			return nil, err
		}
		_ = maybeSyncMemoryEmbedding(ctx, cfg, store, saved)
		return map[string]any{"item": saved, "updated": true, "found": true}, nil
	}
}

func memoryForget(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()

		id := strings.TrimSpace(valueString(req.Args, "id"))
		if id == "" {
			return nil, errors.New("id is required")
		}
		forgotten, err := store.Forget(ctx, id)
		if err != nil {
			return nil, err
		}
		return map[string]any{"id": id, "forgotten": forgotten}, nil
	}
}

func memoryHealth(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()

		health, err := store.Health(ctx)
		if err != nil {
			return nil, err
		}
		return map[string]any{"health": health}, nil
	}
}

func decisionLog(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()

		title := strings.TrimSpace(valueString(req.Args, "title"))
		content := strings.TrimSpace(valueString(req.Args, "content"))
		if title == "" || content == "" {
			return nil, errors.New("title and content are required")
		}
		item := memory.MemoryItem{
			Kind:       "decision",
			Title:      title,
			Content:    content,
			Importance: getIntArg(req.Args, "importance", 4),
			Confidence: getFloatArg(req.Args, "confidence", 0.9),
			Status:     memory.MemoryStatusActive,
		}
		saved, err := store.Upsert(ctx, item)
		if err != nil {
			return nil, err
		}

		agentsRoot, err := resolveOpenClawssyPath(req.Workspace, agentsPath, "agents", "agents")
		if err == nil {
			meta := map[string]any{"title": title}
			if rawMeta, ok := req.Args["metadata"].(map[string]any); ok && len(rawMeta) > 0 {
				meta["metadata"] = rawMeta
			}
			_ = memory.AppendEvent(agentsRoot, req.AgentID, memory.Event{
				Type:      memory.EventTypeDecisionLog,
				Text:      content,
				Timestamp: time.Now().UTC(),
				Metadata:  meta,
			})
		}

		return map[string]any{"logged": true, "item": saved}, nil
	}
}

func memoryCheckpoint(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()
		cfg, err := loadMemoryConfigForRequest(req.Workspace, configPath)
		if err != nil {
			return nil, err
		}
		agentID, err := validatedAgentID(req.AgentID)
		if err != nil {
			return nil, err
		}
		agentsRoot, err := resolveOpenClawssyPath(req.Workspace, agentsPath, "agents", "agents")
		if err != nil {
			return nil, err
		}

		latest, foundLatest, err := memory.LoadLatestCheckpointRecord(agentsRoot, agentID)
		if err != nil {
			return nil, err
		}
		since := time.Time{}
		if foundLatest {
			since = latest.ToTimestamp
		}
		maxEvents := getIntArg(req.Args, "max_events", 250)
		events, err := memory.ReadEventsSince(agentsRoot, agentID, since, maxEvents)
		if err != nil {
			return nil, err
		}
		if len(events) == 0 {
			return map[string]any{
				"checkpoint_created": false,
				"reason":             "no new events",
				"from_timestamp":     since,
			}, nil
		}

		distilledOut := checkpointDistillResult{}
		distillationMode := "model"
		if modelOut, distillErr := distillCheckpointWithModel(ctx, cfg, events); distillErr == nil {
			distilledOut = modelOut
		} else {
			distillationMode = "deterministic_fallback"
			distilledOut.NewItems = checkpointItemsToNew(distillCheckpointItems(events))
			distilledOut.Updates = []checkpointUpdate{}
		}

		upserted := make([]memory.MemoryItem, 0, len(distilledOut.NewItems))
		for _, item := range checkpointNewToMemory(distilledOut.NewItems) {
			saved, err := store.Upsert(ctx, item)
			if err != nil {
				return nil, err
			}
			_ = maybeSyncMemoryEmbedding(ctx, cfg, store, saved)
			upserted = append(upserted, saved)
		}
		updatedCount := 0
		for _, upd := range distilledOut.Updates {
			existing, found, err := store.Get(ctx, upd.ID)
			if err != nil {
				return nil, err
			}
			if !found {
				continue
			}
			existing.Content = upd.NewContent
			existing.Confidence = upd.Confidence
			if _, err := store.Update(ctx, existing); err != nil {
				return nil, err
			}
			_ = maybeSyncMemoryEmbedding(ctx, cfg, store, existing)
			updatedCount++
		}

		result := checkpointDistillResult{
			NewItems: distilledOut.NewItems,
			Updates:  distilledOut.Updates,
		}
		resultRaw, _ := json.Marshal(result)

		createdAt := time.Now().UTC()
		record := memory.CheckpointRecord{
			ID:               fmt.Sprintf("chk_%d", createdAt.UnixNano()),
			AgentID:          agentID,
			CreatedAt:        createdAt,
			FromTimestamp:    since,
			ToTimestamp:      events[len(events)-1].Timestamp,
			EventCount:       len(events),
			NewItemCount:     len(upserted),
			UpdatedItemCount: updatedCount,
			Summary:          fmt.Sprintf("Distilled %d events into %d new and %d updated memory items", len(events), len(upserted), updatedCount),
		}
		checkpointPath, err := memory.WriteCheckpointRecord(agentsRoot, agentID, record)
		if err != nil {
			return nil, err
		}

		_ = memory.AppendEvent(agentsRoot, agentID, memory.Event{
			Type:      memory.EventTypeCheckpoint,
			Text:      string(resultRaw),
			Timestamp: createdAt,
			Metadata: map[string]any{
				"event_count":        len(events),
				"new_item_count":     len(upserted),
				"updated_item_count": updatedCount,
				"mode":               distillationMode,
			},
		})

		return map[string]any{
			"checkpoint_created": true,
			"checkpoint_path":    checkpointPath,
			"event_count":        len(events),
			"new_item_count":     len(upserted),
			"updated_item_count": updatedCount,
			"distillation_mode":  distillationMode,
			"result":             result,
		}, nil
	}
}

func memoryMaintenance(agentsPath, configPath string) Handler {
	return func(ctx context.Context, req Request) (map[string]any, error) {
		store, closeFn, err := openAgentMemoryStore(req, agentsPath, configPath)
		if err != nil {
			return nil, err
		}
		defer closeFn()
		agentID, err := validatedAgentID(req.AgentID)
		if err != nil {
			return nil, err
		}
		agentsRoot, err := resolveOpenClawssyPath(req.Workspace, agentsPath, "agents", "agents")
		if err != nil {
			return nil, err
		}

		dryRun := getBoolArg(req.Args, "dry_run", false)
		staleDays := getIntArg(req.Args, "stale_days", 45)
		if staleDays < 7 {
			staleDays = 7
		}

		before, err := store.Health(ctx)
		if err != nil {
			return nil, err
		}
		items, err := store.List(ctx, memory.MemoryStatusActive, 10000)
		if err != nil {
			return nil, err
		}

		dupIDs := duplicateItemIDs(items)
		staleIDs := staleArchiveIDs(items, staleDays)
		verifyIDs := verificationNeededIDs(items)

		deduped := 0
		archivedStale := 0
		if !dryRun {
			for _, id := range dupIDs {
				ok, err := store.Archive(ctx, id)
				if err != nil {
					return nil, err
				}
				if ok {
					deduped++
				}
			}
			for _, id := range staleIDs {
				ok, err := store.Archive(ctx, id)
				if err != nil {
					return nil, err
				}
				if ok {
					archivedStale++
				}
			}
			if err := store.Vacuum(ctx); err != nil {
				return nil, err
			}
		}

		after, err := store.Health(ctx)
		if err != nil {
			return nil, err
		}
		report := memory.MaintenanceReport{
			ID:                   fmt.Sprintf("maint_%d", time.Now().UTC().UnixNano()),
			AgentID:              agentID,
			CreatedAt:            time.Now().UTC(),
			DeduplicatedCount:    deduped,
			ArchivedStaleCount:   archivedStale,
			VerificationCount:    len(verifyIDs),
			Compacted:            !dryRun,
			Before:               before,
			After:                after,
			VerificationItemIDs:  verifyIDs,
			ArchivedDuplicateIDs: dupIDs,
			ArchivedStaleIDs:     staleIDs,
			Metadata:             map[string]any{"dry_run": dryRun, "stale_days": staleDays},
		}
		reportPath, err := memory.WriteMaintenanceReport(agentsRoot, agentID, report)
		if err != nil {
			return nil, err
		}
		if !dryRun {
			_ = memory.AppendEvent(agentsRoot, agentID, memory.Event{
				Type:      memory.EventTypeMaintenance,
				Text:      fmt.Sprintf("maintenance completed: deduped=%d stale_archived=%d verify=%d", deduped, archivedStale, len(verifyIDs)),
				Timestamp: time.Now().UTC(),
				Metadata: map[string]any{
					"report_path": reportPath,
					"dry_run":     false,
				},
			})
		}

		return map[string]any{
			"ok":                   true,
			"dry_run":              dryRun,
			"report_path":          reportPath,
			"deduplicated_count":   deduped,
			"archived_stale_count": archivedStale,
			"verification_count":   len(verifyIDs),
			"before":               before,
			"after":                after,
		}, nil
	}
}

func openAgentMemoryStore(req Request, configuredAgentsPath, configuredConfigPath string) (*memorystore.SQLiteStore, func(), error) {
	if req.Policy == nil {
		return nil, nil, errors.New("policy is required")
	}
	agentID, err := validatedAgentID(req.AgentID)
	if err != nil {
		return nil, nil, err
	}
	if err := memoryEnabledForRequest(req.Workspace, configuredConfigPath); err != nil {
		return nil, nil, err
	}
	agentsRoot, err := resolveOpenClawssyPath(req.Workspace, configuredAgentsPath, "agents", "agents")
	if err != nil {
		return nil, nil, err
	}
	dbPath := filepath.Join(agentsRoot, agentID, "memory", "memory.db")
	store, err := memorystore.OpenSQLite(dbPath, agentID)
	if err != nil {
		return nil, nil, err
	}
	return store, func() { _ = store.Close() }, nil
}

func memoryEnabledForRequest(workspace, configuredConfigPath string) error {
	cfg, err := loadMemoryConfigForRequest(workspace, configuredConfigPath)
	if err != nil {
		return err
	}
	if !cfg.Memory.Enabled {
		return errors.New("memory is disabled (set memory.enabled=true)")
	}
	return nil
}

func loadMemoryConfigForRequest(workspace, configuredConfigPath string) (config.Config, error) {
	cfgPath, err := resolveOpenClawssyPath(workspace, configuredConfigPath, "config", "config.json")
	if err != nil {
		return config.Config{}, err
	}
	cfg, err := config.LoadOrDefault(cfgPath)
	if err != nil {
		return config.Config{}, err
	}
	return cfg, nil
}

func getFloatArg(args map[string]any, key string, fallback float64) float64 {
	raw, ok := args[key]
	if !ok {
		return fallback
	}
	switch v := raw.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	default:
		return fallback
	}
}

func distillCheckpointItems(events []memory.Event) []memory.MemoryItem {
	if len(events) == 0 {
		return nil
	}
	titleToItem := map[string]memory.MemoryItem{}
	for _, evt := range events {
		text := strings.TrimSpace(evt.Text)
		if text == "" {
			continue
		}
		switch evt.Type {
		case memory.EventTypeDecisionLog:
			title := metadataString(evt.Metadata, "title")
			if title == "" {
				title = "Decision noted"
			}
			titleToItem["decision:"+title] = memory.MemoryItem{Kind: "decision", Title: title, Content: text, Importance: 4, Confidence: 0.9, Status: memory.MemoryStatusActive}
		case memory.EventTypeError:
			title := "Recent error"
			titleToItem["error:"+text] = memory.MemoryItem{Kind: "issue", Title: title, Content: text, Importance: 4, Confidence: 0.85, Status: memory.MemoryStatusActive}
		case memory.EventTypeUserMessage:
			if looksLikePreference(text) {
				title := "User preference"
				titleToItem["pref:"+text] = memory.MemoryItem{Kind: "preference", Title: title, Content: text, Importance: 3, Confidence: 0.75, Status: memory.MemoryStatusActive}
			}
		}
	}
	if len(titleToItem) == 0 {
		summary := summarizeEvents(events)
		if strings.TrimSpace(summary) == "" {
			return nil
		}
		return []memory.MemoryItem{{Kind: "summary", Title: "Checkpoint summary", Content: summary, Importance: 2, Confidence: 0.65, Status: memory.MemoryStatusActive}}
	}
	keys := make([]string, 0, len(titleToItem))
	for key := range titleToItem {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	items := make([]memory.MemoryItem, 0, len(keys))
	for _, key := range keys {
		items = append(items, titleToItem[key])
	}
	return items
}

func summarizeEvents(events []memory.Event) string {
	counts := map[string]int{}
	for _, evt := range events {
		counts[evt.Type]++
	}
	parts := make([]string, 0, len(counts))
	for typ, count := range counts {
		parts = append(parts, fmt.Sprintf("%s=%d", typ, count))
	}
	sort.Strings(parts)
	return "Checkpoint event summary: " + strings.Join(parts, ", ")
}

func metadataString(meta map[string]any, key string) string {
	if len(meta) == 0 {
		return ""
	}
	v, ok := meta[key]
	if !ok {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return strings.TrimSpace(s)
}

func looksLikePreference(text string) bool {
	value := strings.ToLower(strings.TrimSpace(text))
	if value == "" {
		return false
	}
	markers := []string{"i prefer", "prefer ", "please", "always", "never", "remind me", "don't", "do not"}
	for _, marker := range markers {
		if strings.Contains(value, marker) {
			return true
		}
	}
	return false
}

func checkpointItemsToNew(items []memory.MemoryItem) []checkpointNewItem {
	out := make([]checkpointNewItem, 0, len(items))
	for _, item := range items {
		out = append(out, checkpointNewItem{
			Kind:       item.Kind,
			Title:      item.Title,
			Content:    item.Content,
			Importance: item.Importance,
			Confidence: item.Confidence,
		})
	}
	return out
}

func checkpointNewToMemory(items []checkpointNewItem) []memory.MemoryItem {
	out := make([]memory.MemoryItem, 0, len(items))
	for _, item := range items {
		out = append(out, memory.MemoryItem{
			Kind:       item.Kind,
			Title:      item.Title,
			Content:    item.Content,
			Importance: item.Importance,
			Confidence: item.Confidence,
			Status:     memory.MemoryStatusActive,
		})
	}
	return out
}

func duplicateItemIDs(items []memory.MemoryItem) []string {
	if len(items) == 0 {
		return nil
	}
	type seenItem struct {
		id         string
		importance int
		updatedAt  time.Time
	}
	seen := map[string]seenItem{}
	dups := []string{}
	for _, item := range items {
		key := strings.ToLower(strings.TrimSpace(item.Kind + "|" + item.Title + "|" + normalizeDedupeContent(item.Content)))
		if key == "||" {
			continue
		}
		cur, ok := seen[key]
		if !ok {
			seen[key] = seenItem{id: item.ID, importance: item.Importance, updatedAt: item.UpdatedAt}
			continue
		}
		keepExisting := cur.importance > item.Importance || (cur.importance == item.Importance && cur.updatedAt.After(item.UpdatedAt))
		if keepExisting {
			dups = append(dups, item.ID)
			continue
		}
		dups = append(dups, cur.id)
		seen[key] = seenItem{id: item.ID, importance: item.Importance, updatedAt: item.UpdatedAt}
	}
	return uniqueSortedStrings(dups)
}

func staleArchiveIDs(items []memory.MemoryItem, staleDays int) []string {
	if len(items) == 0 {
		return nil
	}
	threshold := time.Now().UTC().Add(-time.Duration(staleDays) * 24 * time.Hour)
	ids := []string{}
	for _, item := range items {
		if item.UpdatedAt.IsZero() {
			continue
		}
		if item.UpdatedAt.Before(threshold) && item.Importance <= 2 {
			ids = append(ids, item.ID)
		}
	}
	return uniqueSortedStrings(ids)
}

func verificationNeededIDs(items []memory.MemoryItem) []string {
	ids := []string{}
	threshold := time.Now().UTC().Add(-30 * 24 * time.Hour)
	for _, item := range items {
		if item.Importance >= 3 && (item.Confidence < 0.6 || item.UpdatedAt.Before(threshold)) {
			ids = append(ids, item.ID)
		}
	}
	return uniqueSortedStrings(ids)
}

func normalizeDedupeContent(content string) string {
	value := strings.ToLower(strings.TrimSpace(content))
	if len(value) > 160 {
		value = value[:160]
	}
	return value
}

func uniqueSortedStrings(items []string) []string {
	if len(items) == 0 {
		return nil
	}
	set := map[string]struct{}{}
	for _, item := range items {
		value := strings.TrimSpace(item)
		if value != "" {
			set[value] = struct{}{}
		}
	}
	out := make([]string, 0, len(set))
	for item := range set {
		out = append(out, item)
	}
	sort.Strings(out)
	return out
}

func maybeSyncMemoryEmbedding(ctx context.Context, cfg config.Config, store *memorystore.SQLiteStore, item memory.MemoryItem) error {
	if store == nil || !cfg.Memory.EmbeddingsEnabled {
		return nil
	}
	embedder, err := memoryEmbedderFromConfig(cfg)
	if err != nil || embedder == nil {
		return err
	}
	text := strings.TrimSpace(item.Title + "\n" + item.Content)
	if text == "" {
		return nil
	}
	vec, err := embedder.Embed(ctx, text)
	if err != nil {
		return err
	}
	return store.UpsertEmbedding(ctx, item.ID, embedder.ModelID(), vec)
}

func semanticRecallWithEmbedding(ctx context.Context, cfg config.Config, store *memorystore.SQLiteStore, params memory.SearchParams) ([]memory.MemoryItem, string) {
	embedder, err := memoryEmbedderFromConfig(cfg)
	if err != nil || embedder == nil {
		return nil, "fts"
	}
	vec, err := embedder.Embed(ctx, params.Query)
	if err != nil {
		return nil, "fts"
	}
	normalized := memory.NormalizeSearchParams(params)
	items, err := store.SearchByEmbedding(ctx, vec, normalized.Limit, normalized.MinImportance, normalized.Status)
	if err != nil {
		return nil, "fts"
	}
	if len(items) == 0 {
		return nil, "fts"
	}
	return items, "semantic_hybrid"
}

func mergeMemoryItems(primary, secondary []memory.MemoryItem, limit int) []memory.MemoryItem {
	if limit <= 0 {
		limit = 8
	}
	out := make([]memory.MemoryItem, 0, limit)
	seen := map[string]struct{}{}
	appendItems := func(items []memory.MemoryItem) {
		for _, item := range items {
			if len(out) >= limit {
				return
			}
			id := strings.TrimSpace(item.ID)
			if id != "" {
				if _, ok := seen[id]; ok {
					continue
				}
				seen[id] = struct{}{}
			}
			out = append(out, item)
		}
	}
	appendItems(primary)
	appendItems(secondary)
	return out
}
