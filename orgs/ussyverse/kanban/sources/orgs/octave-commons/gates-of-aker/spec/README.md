# Gates of Aker - Specifications

This directory contains detailed specifications for the Gates of Aker project.

**Important:** All specifications and GitHub issues use the labeling system defined in [[spec/labeling-system.md]]. Please review that document before creating new specs or issues.

## Labeling System

- [[spec/labeling-system.md]] - Comprehensive labeling system for GitHub issues and spec files
  - Priority levels (critical, high, medium, low)
  - Component categorization (backend, frontend, ecs, myth, champion, factions, world)
  - Type classification (bug, feature, refactor, performance, security, documentation, design, testing, task)
  - Status tracking (proposed, active, in-review, blocked, waiting, done)
  - Complexity estimation (trivial, small, medium, large, xlarge)
  - Milestone tracking (1-7, 3.5)

## Core Specifications
- [[spec/2026-01-15-core-loop.md]] - Day/night cycle mechanics and champion agency
- [[spec/2026-01-15-myth-engine.md]] - Myth engine, miracle pipeline, and belief systems
- [[spec/2026-01-15-gates-of-aker-roadmap.md]] - Concise roadmap summary

## Milestone Specifications
- [[spec/2026-01-17-milestone2-walls-pathing-build-ghosts.md]] - Walls, pathing, and build ghosts (Sprint 2)
- [[spec/2026-01-17-milestone3-colony-core.md]] - Colony job loop and needs system
- [[spec/2026-01-22-milestone3.5-final-report.md]] - Spatial facets and memory system status
- [[spec/2026-01-22-milestone3.5-assessment.md]] - Milestone 3.5 assessment
- [[spec/2026-01-22-milestone3.5-status.md]] - Frontend status for Milestone 3.5
- [[spec/2026-01-22-milestone3.5-integration-progress.md]] - Integration progress report
- [[spec/2026-01-22-milestone3.5-completion-report.md]] - Final completion report

## Design Specifications
- [[spec/2026-01-15-champion-agency.md]] - Champion control and mechanics
- [[spec/2026-01-15-semantic-packets.md]] - Semantic packets for communication

## Code Quality & Architecture
- [[spec/backend-code-review-2026-01-22.md]] - Backend code review findings
- [[spec/2026-01-22-frontend-code-review-recommendations.md]] - Frontend code review catalog
- [[spec/backend-issues/CRITICAL-001-implement-query-need-axis.md]] - Implement query-need-axis stub
- [[spec/backend-issues/TEST-001-fix-test-runner.md]] - Fix test runner configuration
- [[spec/backend-issues/SECURITY-001-input-validation.md]] - Add input validation for WebSocket
- [[spec/backend-issues/ARCH-001-split-jobs-clj.md]] - Split monolithic jobs.clj
- [[spec/backend-issues/ARCH-002-add-docstrings.md]] - Add docstrings to public functions
- [[spec/backend-issues/STYLE-001-magic-numbers.md]] - Replace magic numbers with constants

## ECS Migration
- [[spec/ecs-migration-plan.md]] - Overall ECS migration strategy
- [[spec/issues/ecs-migration/README.md]] - ECS migration issue tracker
- [[spec/issues/ecs-migration/001-phase-1-foundation.md]] - Phase 1: Foundation ECS Layer
- [[spec/issues/ecs-migration/002-phase-2-component-extraction.md]] - Phase 2: Extract Agent Data
- [[spec/issues/ecs-migration/003-phase-3-systems.md]] - Phase 3: Extract Tick Logic
- [[spec/issues/ecs-migration/004-phase-4-world-migration.md]] - Phase 4: Migrate World State
- [[spec/issues/ecs-migration/005-phase-5-advanced-features.md]] - Phase 5: Advanced ECS Features
- [[spec/issues/ecs-migration/006-phase-6-lod.md]] - Phase 6: LOD and Tile Loading

## Testing and DevOps
- [[spec/2026-01-13-backend-coverage.md]] - Backend test coverage
- [[spec/2026-01-13-backend-tests.md]] - Backend testing
- [[spec/2026-01-13-rimworld-aligned-model.md]] - RimWorld-aligned model design
- [[spec/2026-01-14-docker-compose.md]] - Docker Compose setup
- [[spec/2026-01-15-backend-coverage-push.md]] - Backend coverage push
- [[spec/2026-01-15-backend-integration-tests.md]] - Backend integration tests
- [[spec/2026-01-15-backend-tests-review.md]] - Backend tests review
- [[spec/2026-01-15-docs-notes-review.md]] - Documentation review
- [[spec/2026-01-15-frontend-tests.md]] - Frontend testing
- [[spec/2026-01-15-app-componentization.md]] - App componentization
- [[spec/2026-01-16-compose-e2e-tests.md]] - Compose e2e tests
- [[spec/2026-01-16-docker-compose-setup.md]] - Docker compose setup

## Game Mechanics & Features
- [[spec/2025-01-15-mvp.md]] - MVP definition (legacy location, see [[docs/notes/planning/2025-01-15-mvp.md]])
- [[spec/add-configurable-tree-count.md]] - Configurable tree count
- [[spec/opencode-customization-agents.md]] - OpenCode customization guide
- [[spec/tree-fruit-dropping.md]] - Tree fruit dropping mechanics
- [[spec/fog-of-war.md]] - Fog of war mechanics
- [[spec/biomes.md]] - Biome system
- [[spec/colonist-combat-durability.md]] - Colonist combat and durability
- [[spec/2026-01-20-social-abstract-layer.md]] - Social abstract layer
- [[spec/2026-01-20-social-interactions.md]] - Social interactions
- [[spec/2026-01-20-roads-happy-rest-stats.md]] - Roads, happiness, rest stats
- [[spec/2026-01-20-reproduction.md]] - Reproduction system
- [[spec/2026-01-20-musical-sim-audio.md]] - Musical simulation audio
- [[spec/2026-01-20-palette-stockpile-totals.md]] - Palette and stockpile totals
- [[spec/2026-01-20-factions-viewer.md]] - Factions viewer
- [[spec/2026-01-20-farm-job-building.md]] - Farm job building
- [[spec/2026-01-20-combat-hunting-factions.md]] - Combat, hunting, factions
- [[spec/2026-01-20-civic-growth-scribes.md]] - Civic growth and scribes
- [[spec/2026-01-20-backend-code-review.md]] - Backend code review
- [[spec/2026-01-20-agent-fire-creation-mood.md]] - Agent fire, creation, mood
- [[spec/2026-01-19-shrine-job-queue.md]] - Shrine job queue
- [[spec/2026-01-19-milestone3-lifecycle.md]] - Milestone 3 lifecycle
- [[spec/2026-01-19-job-provider-recipe-loop.md]] - Job provider recipe loop
- [[spec/2026-01-19-wood-orders-idle-builds.md]] - Wood orders, idle builds
- [[spec/2026-01-19-sleep-hunger-time-ui.md]] - Sleep, hunger, time UI
- [[spec/2026-01-19-milestone3-facets.md]] - Milestone 3 facets
- [[spec/2026-01-19-logging-improvements.md]] - Logging improvements
- [[spec/2026-01-19-frontend-optimizations.md]] - Frontend optimizations
- [[spec/2026-01-19-food-fruit-logs.md]] - Food, fruit logs
- [[spec/2026-01-19-health-indicator.md]] - Health indicator
- [[spec/2026-01-19-building-palette.md]] - Building palette
- [[spec/2026-01-18-pathing-logging.md]] - Pathing logging
- [[spec/2026-01-18-ecs-migration.md]] - ECS migration overview
- [[spec/2026-01-18-ecs-integration.md]] - ECS integration
- [[spec/2026-01-18-observability.md]] - Observability
- [[spec/2026-01-15-semantic-packets.md]] - Semantic packets
- [[spec/2026-01-16-compose-e2e-tests.md]] - Compose E2E tests
- [[spec/2026-01-17-next-sim-step.md]] - Next simulation step
- [[spec/2026-01-17-milestone2-walls-pathing-build-ghosts.md]] - Milestone 2 walls/pathing
- [[spec/2026-01-17-milestone3-colony-core.md]] - Milestone 3 colony core
- [[spec/2025-01-21-unique-agent-voices.md]] - Unique agent voices
- [[spec/2026-01-14-docker-compose.md]] - Docker Compose
- [[spec/2025-01-20-speech-bubbles-and-social-sounds.md]] - Speech bubbles and social sounds

## Recent Specs (January 2026)
- [[spec/2026-01-22-bun-migration.md]] - Bun migration plan
- [[spec/2026-01-21-trace-mythology-system.md]] - Trace mythology system
- [[spec/2026-01-21-unified-cultural-panel.md]] - Unified cultural panel
- [[spec/2026-01-21-ollama-cold-start-improvements.md]] - Ollama cold start improvements
- [[spec/2026-01-21-wildlife-ecosystem.md]] - Wildlife ecosystem
- [[spec/2026-01-21-reproduction-constraints.md]] - Reproduction constraints
- [[spec/2026-01-21-milestone3-3.5-next-steps.md]] - Milestone 3 & 3.5 next steps
- [[spec/2026-01-21-los-and-delta-updates.md]] - LOS and delta updates
- [[spec/2026-01-21-los-and-delta-updates-summary.md]] - LOS and delta updates summary
- [[spec/2026-01-21-job-loop-verification.md]] - Job loop verification
- [[spec/2026-01-21-aggressive-civilization-building.md]] - Aggressive civilization building
- [[spec/2026-01-21-myth-panel.md]] - Myth panel
- [[spec/2026-01-21-hunting-improvements.md]] - Hunting improvements
- [[spec/2026-01-20-tiles-blank.md]] - Tiles blank issue
- [[spec/2026-01-20-social-visualization.md]] - Social visualization
- [[spec/2026-01-20-tree-fruit-growth-tuning.md]] - Tree fruit growth tuning
- [[spec/2026-01-20-tile-selection-standardization.md]] - Tile selection standardization
- [[spec/2026-01-20-food-hunting-mythology.md]] - Food, hunting, mythology
- [[spec/2026-01-20-ecs-spec.md]] - ECS specification
- [[spec/2026-01-20-sim-stuck-first-tick.md]] - Sim stuck first tick
- [[spec/2026-01-20-fruit-reduction.md]] - Fruit reduction

## Migration & Refactoring
- [[spec/2026-01-22-bun-migration.md]] - Bun migration from Node.js
- [[spec/2026-01-18-ecs-migration.md]] - ECS migration overview
- [[spec/2026-01-18-ecs-integration.md]] - ECS integration

## Performance & Optimization
- [[spec/2026-01-19-frontend-optimizations.md]] - Frontend optimization recommendations
- [[spec/2026-01-21-los-and-delta-updates.md]] - LOS and delta updates optimization

## Other Specs
- [[spec/2025-01-15-mvp.md]] - MVP definition (legacy location, see [[docs/notes/planning/2025-01-15-mvp.md]])

## Related Documentation
- [[README.md]] - Project overview
- [[AGENTS.md]] - Coding standards
- [[HACK.md]] - High-level vision
- [[docs/notes/planning/2026-01-15-roadmap.md]] - Detailed roadmap
- [[docs/tasks]] - Task breakdown
