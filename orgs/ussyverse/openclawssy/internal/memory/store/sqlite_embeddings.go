package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"sort"
	"strings"
	"time"

	"openclawssy/internal/memory"
)

func (s *SQLiteStore) UpsertEmbedding(ctx context.Context, memoryID, model string, vector []float32) error {
	memoryID = strings.TrimSpace(memoryID)
	model = strings.TrimSpace(model)
	if memoryID == "" {
		return errors.New("memory store: memory id is required")
	}
	if model == "" {
		return errors.New("memory store: embedding model is required")
	}
	if len(vector) == 0 {
		return errors.New("memory store: embedding vector is required")
	}
	raw, err := json.Marshal(vector)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO memory_embeddings(memory_id, agent_id, model, vector_json, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(memory_id) DO UPDATE SET
			model=excluded.model,
			vector_json=excluded.vector_json,
			updated_at=excluded.updated_at
	`, memoryID, s.agentID, model, string(raw), time.Now().UTC())
	return err
}

func (s *SQLiteStore) SearchByEmbedding(ctx context.Context, queryVector []float32, limit, minImportance int, status string) ([]memory.MemoryItem, error) {
	if len(queryVector) == 0 {
		return nil, nil
	}
	if limit <= 0 {
		limit = 8
	}
	if limit > 100 {
		limit = 100
	}
	if minImportance <= 0 {
		minImportance = 1
	}
	status = strings.TrimSpace(status)
	if status == "" {
		status = memory.MemoryStatusActive
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT m.id, m.agent_id, m.kind, m.title, m.content, m.importance, m.confidence, m.status, m.created_at, m.updated_at, e.vector_json
		FROM memory_items m
		JOIN memory_embeddings e ON m.id = e.memory_id
		WHERE m.agent_id = ?
		  AND m.status = ?
		  AND m.importance >= ?
	`, s.agentID, status, minImportance)
	if err != nil {
		if isNoSuchTable(err) {
			return nil, nil
		}
		return nil, err
	}
	defer rows.Close()

	type candidate struct {
		item  memory.MemoryItem
		score float64
	}
	candidates := []candidate{}
	for rows.Next() {
		var item memory.MemoryItem
		var vectorJSON string
		if err := rows.Scan(
			&item.ID,
			&item.AgentID,
			&item.Kind,
			&item.Title,
			&item.Content,
			&item.Importance,
			&item.Confidence,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
			&vectorJSON,
		); err != nil {
			return nil, err
		}
		var vec []float32
		if err := json.Unmarshal([]byte(vectorJSON), &vec); err != nil {
			continue
		}
		score := cosineSimilarity(queryVector, vec)
		if math.IsNaN(score) || score <= 0 {
			continue
		}
		candidates = append(candidates, candidate{item: item, score: score})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	sort.Slice(candidates, func(i, j int) bool {
		if candidates[i].score == candidates[j].score {
			return candidates[i].item.UpdatedAt.After(candidates[j].item.UpdatedAt)
		}
		return candidates[i].score > candidates[j].score
	})
	if len(candidates) > limit {
		candidates = candidates[:limit]
	}
	out := make([]memory.MemoryItem, 0, len(candidates))
	for _, cand := range candidates {
		out = append(out, cand.item)
	}
	return out, nil
}

func cosineSimilarity(a, b []float32) float64 {
	if len(a) == 0 || len(a) != len(b) {
		return 0
	}
	var dot, normA, normB float64
	for i := range a {
		av := float64(a[i])
		bv := float64(b[i])
		dot += av * bv
		normA += av * av
		normB += bv * bv
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

func isNoSuchTable(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, sql.ErrNoRows) {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "no such table")
}

func (s *SQLiteStore) EmbeddingStats(ctx context.Context) (vectorCount int, activeVectorCount int, models map[string]int, err error) {
	models = map[string]int{}
	if s == nil || s.db == nil {
		return 0, 0, models, errors.New("memory store: nil database")
	}
	if err = s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM memory_embeddings WHERE agent_id = ?`, s.agentID).Scan(&vectorCount); err != nil {
		if isNoSuchTable(err) {
			return 0, 0, models, nil
		}
		return 0, 0, models, err
	}
	if err = s.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM memory_embeddings e
		JOIN memory_items m ON m.id = e.memory_id
		WHERE e.agent_id = ?
		  AND m.agent_id = ?
		  AND m.status = ?
	`, s.agentID, s.agentID, memory.MemoryStatusActive).Scan(&activeVectorCount); err != nil {
		if isNoSuchTable(err) {
			return vectorCount, 0, models, nil
		}
		return vectorCount, 0, models, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT model, COUNT(*)
		FROM memory_embeddings
		WHERE agent_id = ?
		GROUP BY model
	`, s.agentID)
	if err != nil {
		if isNoSuchTable(err) {
			return vectorCount, activeVectorCount, models, nil
		}
		return vectorCount, activeVectorCount, models, err
	}
	defer rows.Close()
	for rows.Next() {
		var model string
		var count int
		if scanErr := rows.Scan(&model, &count); scanErr != nil {
			return vectorCount, activeVectorCount, models, scanErr
		}
		models[strings.TrimSpace(model)] = count
	}
	if err = rows.Err(); err != nil {
		return vectorCount, activeVectorCount, models, err
	}
	return vectorCount, activeVectorCount, models, nil
}
