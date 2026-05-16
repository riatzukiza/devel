// Package controlplane provides CRUD for GovOne's operational entities.
//
// Manages tenants, AI systems, policy profiles, model endpoints, and retrieval sources.
package controlplane

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// Tenant represents an organization using GovOne.
type Tenant struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Config    json.RawMessage `json:"config,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// AISystem represents a registered AI system under a tenant.
type AISystem struct {
	ID         string          `json:"id"`
	TenantID   string          `json:"tenant_id"`
	Name       string          `json:"name"`
	Endpoint   string          `json:"endpoint"`
	PolicyID   string          `json:"policy_id"`
	Config     json.RawMessage `json:"config,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

// PolicyProfile defines governance rules for an AI system.
type PolicyProfile struct {
	ID                 string          `json:"id"`
	TenantID           string          `json:"tenant_id"`
	Name               string          `json:"name"`
	CoherenceThreshold float64         `json:"coherence_threshold"`
	CriticalFailDelta  float64         `json:"critical_fail_delta"`
	RequireVerified    bool            `json:"require_verified"`
	Config             json.RawMessage `json:"config,omitempty"`
	CreatedAt          time.Time       `json:"created_at"`
}

// RetrievalSource defines a data source for the graph-backed retrieve stage.
type RetrievalSource struct {
	ID         string          `json:"id"`
	TenantID   string          `json:"tenant_id"`
	Name       string          `json:"name"`
	Type       string          `json:"type"` // "sqlite_fts", "graph", "external"
	Endpoint   string          `json:"endpoint,omitempty"`
	Config     json.RawMessage `json:"config,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

// Service provides CRUD operations for control plane entities.
type Service struct {
	db *sql.DB
}

// NewService creates a new control plane service.
func NewService(db *sql.DB) (*Service, error) {
	s := &Service{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("controlplane migrate: %w", err)
	}
	return s, nil
}

func (s *Service) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS tenants (
		id         TEXT PRIMARY KEY,
		name       TEXT NOT NULL,
		config     BLOB DEFAULT '{}',
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS ai_systems (
		id         TEXT PRIMARY KEY,
		tenant_id  TEXT NOT NULL REFERENCES tenants(id),
		name       TEXT NOT NULL,
		endpoint   TEXT DEFAULT '',
		policy_id  TEXT DEFAULT '',
		config     BLOB DEFAULT '{}',
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS policy_profiles (
		id                   TEXT PRIMARY KEY,
		tenant_id            TEXT NOT NULL REFERENCES tenants(id),
		name                 TEXT NOT NULL,
		coherence_threshold  REAL NOT NULL DEFAULT 0.98,
		critical_fail_delta  REAL NOT NULL DEFAULT 0.10,
		require_verified     INTEGER NOT NULL DEFAULT 1,
		config               BLOB DEFAULT '{}',
		created_at           TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS retrieval_sources (
		id         TEXT PRIMARY KEY,
		tenant_id  TEXT NOT NULL REFERENCES tenants(id),
		name       TEXT NOT NULL,
		type       TEXT NOT NULL DEFAULT 'graph',
		endpoint   TEXT DEFAULT '',
		config     BLOB DEFAULT '{}',
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE INDEX IF NOT EXISTS idx_systems_tenant ON ai_systems(tenant_id);
	CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policy_profiles(tenant_id);
	CREATE INDEX IF NOT EXISTS idx_sources_tenant ON retrieval_sources(tenant_id);
	`
	_, err := s.db.Exec(schema)
	return err
}

// CreateTenant creates a new tenant.
func (s *Service) CreateTenant(t *Tenant) error {
	if t.CreatedAt.IsZero() {
		t.CreatedAt = time.Now().UTC()
	}
	if t.Config == nil {
		t.Config = json.RawMessage(`{}`)
	}
	_, err := s.db.Exec(`
		INSERT INTO tenants (id, name, config, created_at) VALUES (?, ?, ?, ?)
	`, t.ID, t.Name, t.Config, t.CreatedAt.Format(time.RFC3339))
	return err
}

// GetTenant retrieves a tenant by ID.
func (s *Service) GetTenant(id string) (*Tenant, error) {
	t := &Tenant{}
	var config []byte
	var ts string
	err := s.db.QueryRow(`SELECT id, name, config, created_at FROM tenants WHERE id = ?`, id).
		Scan(&t.ID, &t.Name, &config, &ts)
	if err != nil {
		return nil, err
	}
	t.Config = config
	t.CreatedAt, _ = time.Parse(time.RFC3339, ts)
	return t, nil
}

// CreateAISystem registers a new AI system.
func (s *Service) CreateAISystem(sys *AISystem) error {
	if sys.CreatedAt.IsZero() {
		sys.CreatedAt = time.Now().UTC()
	}
	if sys.Config == nil {
		sys.Config = json.RawMessage(`{}`)
	}
	_, err := s.db.Exec(`
		INSERT INTO ai_systems (id, tenant_id, name, endpoint, policy_id, config, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, sys.ID, sys.TenantID, sys.Name, sys.Endpoint, sys.PolicyID, sys.Config, sys.CreatedAt.Format(time.RFC3339))
	return err
}

// CreatePolicyProfile creates a new policy profile.
func (s *Service) CreatePolicyProfile(p *PolicyProfile) error {
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now().UTC()
	}
	if p.Config == nil {
		p.Config = json.RawMessage(`{}`)
	}
	_, err := s.db.Exec(`
		INSERT INTO policy_profiles (id, tenant_id, name, coherence_threshold, critical_fail_delta, require_verified, config, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, p.ID, p.TenantID, p.Name, p.CoherenceThreshold, p.CriticalFailDelta, p.RequireVerified, p.Config, p.CreatedAt.Format(time.RFC3339))
	return err
}

// GetPolicyProfile retrieves a policy profile by ID.
func (s *Service) GetPolicyProfile(id string) (*PolicyProfile, error) {
	p := &PolicyProfile{}
	var config []byte
	var ts string
	var requireVerified int
	err := s.db.QueryRow(`
		SELECT id, tenant_id, name, coherence_threshold, critical_fail_delta, require_verified, config, created_at
		FROM policy_profiles WHERE id = ?
	`, id).Scan(&p.ID, &p.TenantID, &p.Name, &p.CoherenceThreshold, &p.CriticalFailDelta, &requireVerified, &config, &ts)
	if err != nil {
		return nil, err
	}
	p.RequireVerified = requireVerified == 1
	p.Config = config
	p.CreatedAt, _ = time.Parse(time.RFC3339, ts)
	return p, nil
}

// CreateRetrievalSource registers a new retrieval source.
func (s *Service) CreateRetrievalSource(rs *RetrievalSource) error {
	if rs.CreatedAt.IsZero() {
		rs.CreatedAt = time.Now().UTC()
	}
	if rs.Config == nil {
		rs.Config = json.RawMessage(`{}`)
	}
	_, err := s.db.Exec(`
		INSERT INTO retrieval_sources (id, tenant_id, name, type, endpoint, config, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, rs.ID, rs.TenantID, rs.Name, rs.Type, rs.Endpoint, rs.Config, rs.CreatedAt.Format(time.RFC3339))
	return err
}
