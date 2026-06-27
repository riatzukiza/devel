# Axxium

**The axiomatic identity and auth kernel for the Promethean system.**

Axxium is the shared identity provider that proxx, knoxx, and openplanner all consume. It provides:

- **Actor registry** — Capability-bearing identities
- **Entity registry** — Pure identities (the underlying "who"
- **Session management** — Cookie + JWT-based sessions
- **OAuth provider** — For service-to-service auth
- **Portal** — User-facing identity management

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Development
npm run watch

# Build for production
npm run build
npm start
```

## API Endpoints

### Auth
- `GET /api/auth/config` — Public auth configuration
- `POST /api/auth/signup` — Email/password registration
- `POST /api/auth/login` — Email/password login
- `POST /api/auth/logout` — Clear session
- `GET /api/auth/me` — Current actor

### Actors
- `GET /api/actors` — List actors
- `GET /api/actors/:id` — Get actor by ID
- `GET /api/actors/me` — Current actor
- `POST /api/actors/:id/capabilities` — Update capabilities

### Entities
- `GET /api/entities/:id` — Get entity by ID

### System
- `GET /health` — Health check
- `GET /` — Portal redirect
- `GET /portal/index.html` — Axxium portal

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AXXIUM_PORT` | 8787 | HTTP server port |
| `AXXIUM_HOST` | 0.0.0.0 | Bind address |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | axxium | Database name |
| `DB_USER` | axxium | Database user |
| `DB_PASSWORD` | | Database password |
| `JWT_SECRET` | change-me | JWT signing secret |
| `JWT_ISSUER` | axxium | JWT issuer |
| `JWT_AUDIENCE` | promethean | JWT audience |
| `BCRYPT_SALT_ROUNDS` | 12 | Password hashing rounds |

## Architecture

```
┌─────────────────────────────────────────┐
│              AXXIUM KERNEL               │
├─────────────────────────────────────────┤
│  Actor  │  Entity  │  Session  │  OAuth │
│ Registry│ Registry │  Manager  │Provider│
└────┬────┴────┬─────┴─────┬─────┴───┬────┘
     │         │           │         │
     ▼         ▼           ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  proxx  │ │  knoxx  │ │openplanner│ │ tooloxx │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## License

GPL-3.0-only
