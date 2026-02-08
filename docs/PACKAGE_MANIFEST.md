# Package Manifest Document

This document provides a comprehensive inventory of all package manifest and build configuration files found in the devel workspace repository.

## Table of Contents

1. [Root-Level Manifest Files](#root-level-manifest-files)
2. [Clojure/ClojureScript Configuration](#clojureclojurescript-configuration)
3. [PM2 Ecosystem Files](#pm2-ecosystem-files)
4. [Workspace TypeScript Packages](#workspace-typescript-packages)
5. [Submodule Manifest Files](#submodule-manifest-files)
6. [Build and Utility Files](#build-and-utility-files)

---

## Root-Level Manifest Files

### JavaScript/Node.js (package.json)

**File:** `/home/err/devel/package.json`

| Property | Value |
|----------|-------|
| Name | devel |
| Version | 1.0.0 |
| Type | module |
| Package Manager | pnpm@10.14.0 |
| Main Entry | index.js |

**Key Scripts:**
- `pnpm test` - Run test suite with octavia
- `pnpm build` - Build octavia components
- `pnpm generate-ecosystem` - Compile PM2 ecosystem config using shadow-cljs
- `pnpm giga:watch` - Watch and run affected tests
- `pnpm lint:md` - Lint markdown files

**Key Dependencies:**
- `@octokit/rest` (^22.0.1) - GitHub REST API client
- `@opencode-ai/sdk` (^1.1.36) - OpenCode AI SDK
- `chromadb` (^3.2.2) - Vector database client
- `shadow-cljs` (^3.3.5) - ClojureScript compiler
- `redis` (^5.9.0) - Redis client
- `level` (^10.0.0) - LevelDB wrapper

**Trusted Dependencies:**
- `clj-kondo` - Clojure linter

---

## Clojure/ClojureScript Configuration

### Clojure Deps (deps.edn)

**File:** `/home/err/devel/deps.edn`

| Property | Value |
|----------|-------|
| Paths | ["src" "."] |
| Clojure Version | 1.11.3 |

**Core Dependencies:**
- `http-kit/http-kit` (^2.8.0) - HTTP server/client
- `metosin/reitit-ring` (^0.7.2) - Routing
- `cheshire/cheshire` (^5.13.0) - JSON encoding/decoding
- `clj-http/clj-http` (^3.12.3) - HTTP client

**Available Aliases:**
| Alias | Purpose | Main Options |
|-------|---------|--------------|
| :test | Run tests with test.check | `-m cognitect.test-runner.api/test` |
| :coverage | Code coverage with cloverage | `-m cloverage.coverage.api/run` |
| :dev | Development with tools.namespace | `-m clojure.tools.namespace.repl/find` |
| :run | Run main application | `-m pandora.server` |

### ClojureScript (shadow-cljs.edn)

**File:** `/home/err/devel/shadow-cljs.edn`

**Source Paths:**
- `promethean/packages/frontend/src/kanban/cljs`
- `promethean/packages/frontend/src/docops/cljs`
- `promethean/packages/frontend/src/smartgpt-dashboard/cljs`
- `promethean/packages/frontend/src/chat-ui/cljs`
- `promethean/packages/frontend/src/opencode-session-manager/cljs`
- `promethean/packages/frontend/src/openai-server/cljs`
- `promethean/packages/report-forge/cljs`
- `pm2-clj-project/src`
- `ecosystems`

**Build Configurations:**
| Build Target | Type | Output |
|--------------|------|--------|
| :clobber | node-script | `.clobber/index.cjs` |

**Dependencies:**
- `org.clojure/core.async` (1.6.673)
- `cider/cider-nrepl` (0.28.7)
- `reagent/reagent` (1.2.0)
- `re-frame/re-frame` (1.4.3)

### Babashka Tasks (bb.edn)

**File:** `/home/err/devel/bb.edn`

**Task Categories:**

#### REPL Tasks
| Task | Description |
|------|-------------|
| `repl:jvm` | Start JVM REPL for Clojure projects |
| `repl:cljs` | Start ClojureScript REPL |
| `repl:all` | Start both JVM and CLJS REPLs |

#### Build Tasks
| Task | Description |
|------|-------------|
| `build:cljs` | Build all ClojureScript projects |
| `build:dev` | Build in development mode (watch) |
| `build:clean` | Clean all build artifacts |

#### Project-Specific Tasks
| Task | Description |
|------|-------------|
| `mcp:start` | Start Clojure-MCP server |
| `mcp:dev` | Start Clojure-MCP in dev mode |
| `promethean:build` | Build Promethean CLI and services |
| `promethean:watch` | Watch frontend development |

#### Testing Tasks
| Task | Description |
|------|-------------|
| `test:jvm` | Run all JVM tests |
| `test:cljs` | Run ClojureScript tests |
| `test:all` | Run all tests across runtimes |

#### Code Quality Tasks
| Task | Description |
|------|-------------|
| `lint:clj` | Lint Clojure code |
| `lint:cljs` | Lint ClojureScript code |
| `format:clj` | Format Clojure code |
| `format:cljs` | Format ClojureScript code |

#### Workspace Management Tasks
| Task | Description |
|------|-------------|
| `workspace:setup` | Setup entire Clojure workspace |
| `workspace:clean` | Clean all build artifacts |
| `workspace:status` | Show status of all Clojure projects |

#### Development Server Tasks
| Task | Description |
|------|-------------|
| `dev:all` | Start all development servers |
| `dev:opencode` | Start Opencode development environment |
| `dev:promethean` | Start Promethean development environment |

---

## PM2 Ecosystem Files

### Root Ecosystem (ecosystem.cljs)

**File:** `/home/err/devel/ecosystems/ecosystem.cljs`

**Registered Applications:**

| Service Name | Script | Args | Environment |
|--------------|--------|------|-------------|
| `devel/opencode` | bunx | opencode-ai@latest web --port 4096 | NODE_ENV=production |

Duck UI and related cephalon apps are now defined in `ecosystems/cephalon.cljs`.

**Output Paths:**
- Error logs: `./logs/opencode-server-error.log`
- Output logs: `./logs/opencode-server-out.log`
- Combined logs: `./logs/opencode-server.log`

### Legacy Ecosystem Format

The legacy `ecosystem.pm2.edn` file has been removed. Use `ecosystems/*.cljs` files instead.

---

### Compiled Ecosystem Output

**Directory:** `/home/err/devel/.clobber`

**Output File:** `.clobber/index.cjs`

This is the compiled CommonJS output generated by shadow-cljs from the ecosystem.cljs files, which PM2 reads to start all configured processes.

---

## Workspace TypeScript Packages

All packages are located in `/home/err/devel/packages/` and use pnpm workspaces.

### @promethean-os/event

**File:** `/home/err/devel/packages/event/package.json`

| Property | Value |
|----------|-------|
| Name | @promethean-os/event |
| Version | 0.1.0 |
| Type | module |
| Main | dist/index.cjs |
| Types | dist/index.d.ts |

**Scripts:**
- `build` - Compile TypeScript
- `test` - Run tests with ava
- `lint` - Lint with ESLint
- `coverage` - Generate code coverage
- `format` - Format with Prettier

**Dependencies:**
- `uuid` (^11.1.0) - UUID generation

### Other Workspace Packages

| Package | Location | Purpose |
|---------|----------|---------|
| @promethean-os/persistence | packages/persistence | Data persistence layer |
| @promethean-os/fsm | packages/fsm | Finite state machine utilities |
| @promethean-os/utils | packages/utils | General utilities |
| @promethean-os/embedding | packages/embedding | Embedding generation |
| @promethean-os/test-utils | packages/test-utils | Testing utilities |
| @promethean-os/logger | packages/logger | Logging utilities |

---

## Submodule Manifest Files

### Promethean Framework

**Location:** `/home/err/devel/orgs/riatzukiza/promethean/`

**Ecosystem Files:** `/home/err/devel/ecosystems/promethean.cljs`, `/home/err/devel/ecosystems/promethean-frontend.cljs`

**Key Sub-components:**
- CLI tools and utilities
- Frontend packages (Reactant-based)
- Agent framework
- Ecosystem DSL for PM2 configuration

### OpenCode Development

**Location:** `/home/err/devel/orgs/anomalyco/opencode/`

**Package Manager:** Bun

**Key Features:**
- Web-based development environment
- Multi-provider agent support
- Session management

### Clojure MCP Integration

**Location:** `/home/err/devel/orgs/bhauman/clojure-mcp/`

**Purpose:** MCP server for Clojure REPL-driven development

### Open-Hax Codex

**Location:** `/home/err/devel/orgs/open-hax/codex/`

**Type:** Authentication plugin for OpenAI Codex

### TypeScript SDK

**Location:** `/home/err/devel/orgs/moofone/codex-ts-sdk/`

**Package Manager:** pnpm

**Purpose:** TypeScript SDK for OpenAI Codex with cloud tasks

---

## Build and Utility Files

### Makefiles

Located in `/home/err/devel/.emacs.d/tests/`:
- `tests/core/Makefile` - Core tests
- `tests/doc/Makefile` - Documentation tests

### Emacs Configuration

**Location:** `/home/err/devel/.emacs.d/`

**Purpose:** Development environment configuration with Clojure integration

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Root Manifest Files | 3 (package.json, deps.edn, shadow-cljs.edn) |
| Clojure Configuration | 3 (deps.edn, shadow-cljs.edn, bb.edn) |
| Ecosystem Files | 1 main + 10+ submodule ecosystems |
| Workspace Packages | 7+ TypeScript packages |
| Submodule Repositories | 19+ git submodules |

---

## Dependencies Overview

### Runtime Dependencies (Root)

| Package | Version | Purpose |
|---------|---------|---------|
| @octokit/rest | ^22.0.1 | GitHub API |
| @opencode-ai/sdk | ^1.1.36 | AI SDK |
| chromadb | ^3.2.2 | Vector DB |
| commander | ^14.0.2 | CLI framework |
| level | ^10.0.0 | Database |
| redis | ^5.9.0 | Cache |
| shadow-cljs | ^3.3.5 | CLJS compiler |

### Development Dependencies (Root)

| Package | Version | Purpose |
|---------|---------|---------|
| @nx/devkit | ^20.0.0 | Nx tooling |
| @nx/js | ^20.0.0 | JS/TS Nx |
| nx | ^20.0.0 | Build system |
| typescript | ^5.9.3 | TypeScript |
| vitest | ^0.34.5 | Testing |
| stryker | ^0.35.1 | Mutation testing |
| zod | ^3.23.8 | Validation |

---

## Configuration Standards

### TypeScript Configuration

- **Target:** ES2022
- **Module:** CommonJS
- **Strict Mode:** Enabled
- **Import Order:** builtin → external → internal → sibling → index

### Clojure Configuration

- **Clojure Version:** 1.11.3
- **ClojureScript Version:** Managed via shadow-cljs
- **Build Tool:** shadow-cljs for CLJS, deps.edn for JVM

### Package Management

- **Primary:** pnpm (v10.14.0)
- **Secondary:** Bun (for OpenCode)
- **Clojure:** clj, cljs (via deps.edn)

---

*Document generated from repository scan on 2026-02-02*
