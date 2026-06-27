# Issue and Spec Labeling System

**Date:** 2026-01-22
**Version:** 1.0
**Purpose:** Provide a standardized labeling system for GitHub issues and spec files to improve tracking, prioritization, and cross-referencing.

---

## Overview

This specification defines a comprehensive labeling system for:
1. **GitHub Issues** - Bug reports, features, tasks, and epics
2. **Spec Files** - Design documents, technical specs, and implementation plans
3. **Cross-References** - Mapping between issues and specs

The system provides:
- **Consistent priority labeling** across all work
- **Component categorization** for easy filtering
- **Status tracking** for progress monitoring
- **Dependency mapping** for understanding relationships
- **Effort estimation** for capacity planning

---

## Current GitHub Labels

### Existing Labels (Standard GitHub)
- `bug` - Something isn't working (#d73a4a)
- `documentation` - Improvements or additions to documentation (#0075ca)
- `duplicate` - This issue or pull request already exists (#cfd3d7)
- `enhancement` - New feature or request (#a2eeef)
- `good first issue` - Good for newcomers (#7057ff)
- `help wanted` - Extra attention is needed (#008672)
- `invalid` - This doesn't seem right (#e4e669)
- `question` - Further information is requested (#d876e3)
- `wontfix` - This will not be worked on (#ffffff)

---

## Proposed New Labels

### Priority Labels (Color-Coded)

| Label | Color | Description | Usage |
|-------|--------|-------------|--------|
| `priority:critical` | 🔴 #d73a4a | Blocks development or production; requires immediate attention | Critical bugs, blocking issues, security vulnerabilities |
| `priority:high` | 🟠 #ffa500 | Important but not blocking; should be addressed soon | Major features, significant bugs, important refactoring |
| `priority:medium` | 🟡 #f7dc6f | Normal priority; will be addressed in due course | Regular features, minor bugs, code quality |
| `priority:low` | 🟢 #b9f6ca | Nice to have; can be deferred | Minor improvements, documentation, cleanup |

**Usage Guidelines:**
- Every issue must have exactly one priority label
- Default to `priority:medium` if unsure
- Change priority as understanding evolves
- Critical issues block PR merges until resolved

### Component Labels (Categorization)

| Label | Color | Description | Related Specs |
|-------|--------|-------------|----------------|
| `component:backend` | #0052cc | Backend/Clojure code | `spec/backend-issues/*` |
| `component:frontend` | #0366d6 | Frontend/TypeScript code | `spec/2026-01-22-frontend-code-review-recommendations.md` |
| `component:testing` | #7057ff | Test infrastructure and tests | `spec/2026-01-15-backend-tests.md`, `spec/2026-01-15-frontend-tests.md` |
| `component:infrastructure` | #84b6eb | CI/CD, deployment, Docker | `spec/2026-01-14-docker-compose.md` |
| `component:documentation` | #008672 | Documentation and specs | This file |
| `component:ecs` | #d4c5f9 | Entity-Component-System | `spec/issues/ecs-migration/*` |
| `component:myth` | #a2eeef | Myth engine and miracles | `spec/2026-01-15-myth-engine.md` |
| `component:champion` | #fbca04 | Champion control and agency | `spec/2026-01-15-champion-agency.md` |
| `component:factions` | #009874 | Faction AI and diplomacy | Milestone 4-6 specs |
| `component:world` | #bf0fff | World geometry and LOD | `spec/2026-01-15-core-loop.md` |

**Usage Guidelines:**
- Every issue must have at least one component label
- Use multiple labels for cross-component issues
- Default to most relevant component if unsure

### Type Labels (Issue Classification)

| Label | Color | Description | Examples |
|-------|--------|-------------|----------|
| `type:bug` | #d93f0b | Defect in existing functionality | Agent not moving, crash on startup |
| `type:feature` | #a2eeef | New functionality to implement | Add combat system, implement myths |
| `type:refactor` | #fbca04 | Code restructuring without behavior change | Split jobs.clj, extract components |
| `type:performance` | #5319e7 | Optimization work | Reduce GC pressure, improve FPS |
| `type:security` | #d93f0b | Security fixes and hardening | Input validation, rate limiting |
| `type:documentation` | #0075ca | Doc improvements | Add docstrings, update README |
| `type:design` | #bf0fff | Design and architecture decisions | ECS migration, system design |
| `type:testing` | #0052cc | Test-related work | Add unit tests, fix test runner |
| `type:task` | #006b75 | General work item | Update dependencies, configure CI |

**Usage Guidelines:**
- Every issue must have exactly one type label
- Use `bug` for defects in released code
- Use `feature` for new functionality
- Use `refactor` for code reorganization
- Use `task` for work that doesn't fit other categories

### Status Labels (Progress Tracking)

| Label | Color | Description | Transition Rules |
|-------|--------|-------------|------------------|
| `status:proposed` | #d4c5f9 | Issue proposed, not yet started | Initial state for new issues |
| `status:active` | #fbca04 | Currently being worked on | Issue assigned to someone |
| `status:in-review` | #009874 | PR submitted, awaiting review | When PR created |
| `status:blocked` | #d93f0b | Blocked by another issue | Add dependency link |
| `status:waiting` | #f4db8d | Waiting on external factor | Waiting on feedback, library release |
| `status:done` | #b9f6ca | Completed and merged | After PR merged |

**Usage Guidelines:**
- Status labels are managed automatically via PR workflows
- Remove status label when issue is closed
- Use `status:blocked` with dependency comments

### Complexity Labels (Effort Estimation)

| Label | Color | Description | Story Point Estimate |
|-------|--------|-------------|----------------------|
| `complexity:trivial` | #b9f6ca | < 1 hour, no design needed | 1 SP |
| `complexity:small` | #b9f6ca | 1-4 hours, straightforward | 2-3 SP |
| `complexity:medium` | #f7dc6f | 4-8 hours, some design | 5 SP |
| `complexity:large` | #ffa500 | 8-16 hours, significant design | 8 SP |
| `complexity:xlarge` | #d93f0b | > 16 hours, major feature | 13+ SP |

**Usage Guidelines:**
- Estimate complexity when creating issue
- Update estimate as understanding grows
- Use historical data for accuracy
- Consider testing and documentation in estimate

### Milestone Labels (Tracking)

| Label | Color | Description | Related Issues |
|-------|--------|-------------|----------------|
| `milestone:1` | #009874 | Hex Map Backbone | Issue #2 |
| `milestone:2` | #009874 | Walls, Pathing, Build Ghosts | Issue #3 |
| `milestone:3` | #009874 | Colony Job Loop | Issue #4 |
| `milestone:3.5` | #009874 | Spatial Facets & Memory | `spec/2026-01-22-milestone3.5-final-report.md` |
| `milestone:4` | #009874 | Champion Control & Day/Night | Issue #5 |
| `milestone:5` | #009874 | Six Neighbor Factions | Issue #6 |
| `milestone:6` | #009874 | Decks, Signs, and Collisions | Issue #7 |
| `milestone:7` | #009874 | Myth Integration | Issue #8 |

**Usage Guidelines:**
- Add milestone label when issue is part of a milestone
- Remove when milestone is complete
- Use multiple labels for cross-milestone issues

---

## Spec File Labeling

### Spec File Categories

Spec files should be categorized in their frontmatter:

```markdown
---
Type: [spec|design|review|status|roadmap]
Component: [backend|frontend|ecs|myth|champion|factions|world|testing|infrastructure]
Priority: [critical|high|medium|low]
Status: [draft|proposed|approved|implemented|deprecated]
Related-Issues: [issue-id-1, issue-id-2, ...]
Milestone: [1|2|3|3.5|4|5|6|7]
Estimated-Effort: [SP or hours]
---
```

### Spec Type Definitions

| Type | Description | Examples |
|------|-------------|----------|
| `spec` | Technical implementation specification | `spec/backend-issues/CRITICAL-001-implement-query-need-axis.md` |
| `design` | High-level design document | `spec/2026-01-15-core-loop.md`, `spec/2026-01-15-myth-engine.md` |
| `review` | Code or architecture review | `spec/backend-code-review-2026-01-22.md`, `spec/2026-01-22-frontend-code-review-recommendations.md` |
| `status` | Progress status report | `spec/2026-01-22-milestone3.5-final-report.md` |
| `roadmap` | Project roadmap | `spec/2026-01-15-gates-of-aker-roadmap.md` |

### Spec Status Definitions

| Status | Description | When to Use |
|--------|-------------|-------------|
| `draft` | Work in progress, not ready for review | Initial drafts, brainstorming |
| `proposed` | Ready for review and feedback | Completed specs awaiting approval |
| `approved` | Approved for implementation | Design documents signed off |
| `implemented` | Fully implemented | Specs that have been completed |
| `deprecated` | Superseded by newer spec | Outdated specs kept for reference |

---

## Issue-Spec Cross-References

### Linking Issues to Specs

In GitHub issue description:

```markdown
## Related Spec

[Spec Name](path/to/spec.md) - Brief description

Implementation Checklist:
- [ ] Step 1 from spec
- [ ] Step 2 from spec
```

### Linking Specs to Issues

In spec file frontmatter:

```markdown
Related-Issues: [4, 5, 6]
```

Or in spec body:

```markdown
## GitHub Issues

- #4 - Milestone 3 — Colony Job Loop
- #5 - Milestone 4 — Champion Control & Day/Night Gate
- #26 - Define LOD Tile System and World Partitioning
```

### Dependency Management

For issues that depend on other issues:

```markdown
## Dependencies

- Depends on: #4 (Milestone 3)
- Blocks: #5 (Milestone 4)
```

---

## Labeling Workflows

### Creating a New Issue

1. **Title**: Clear, descriptive title
2. **Description**: Include problem, solution, acceptance criteria
3. **Labels**:
   - One priority label (`priority:*`)
   - One or more component labels (`component:*`)
   - One type label (`type:*`)
   - One status label (`status:proposed` - default)
   - One complexity label (`complexity:*`)
   - Milestone label if applicable (`milestone:*`)
4. **Cross-References**: Link to related specs and issues

### Creating a New Spec

1. **Frontmatter**: Complete frontmatter with all metadata
2. **Content**: Include problem statement, solution, DoD
3. **Labels in Frontmatter**: Type, component, priority, status
4. **Cross-References**: Link to related issues and specs
5. **Update README**: Add spec to `spec/README.md` if needed

### Moving from Spec to Issue

When converting a spec to an implementation issue:

1. Create GitHub issue with appropriate labels
2. Link issue in spec: `Related-Issues: [issue-id]`
3. Update spec status to `proposed` or `approved`
4. Track progress by updating issue status labels

### Updating Progress

1. **Start Work**: Change `status:proposed` → `status:active`
2. **Submit PR**: Change `status:active` → `status:in-review`
3. **Blocked**: Add `status:blocked` + comment on blocking issue
4. **Complete**: Remove all status labels, close issue
5. **Update Spec**: Change spec status to `implemented`

---

## Automated Label Management

### GitHub Actions (Recommended)

```yaml
name: Label Management

on:
  pull_request:
    types: [opened, edited, closed]

jobs:
  manage-labels:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            // On PR opened: add 'status:in-review'
            // On PR merged: remove status labels, close related issues
            // On PR closed: remove status labels
```

### Dependency Tracking (Manual)

Use GitHub issue references:

```markdown
Depends on: #4

This implements the spatial facets system described in spec/backend-issues/CRITICAL-001-implement-query-need-axis.md
```

---

## Current Label State Analysis

### Missing Labels

Based on current issues, these labels are needed but not yet created:

- **Priority Labels**: None - use standard priority labels
- **Component Labels**: `component:ecs`, `component:myth`, `component:champion`, `component:factions`
- **Type Labels**: `type:design`, `type:performance`, `type:security`, `type:refactor`
- **Status Labels**: `status:*` - all status labels missing
- **Complexity Labels**: `complexity:*` - all complexity labels missing
- **Milestone Labels**: `milestone:*` - only standard issue labels exist

### Label Migration Plan

**Phase 1: Create Core Labels (Week 1)**
- Create all priority labels
- Create all component labels
- Create all type labels
- Create all status labels

**Phase 2: Migrate Existing Issues (Week 2)**
- Review all open issues (26 current issues)
- Apply appropriate labels to each issue
- Add cross-references to related specs

**Phase 3: Update Spec Files (Week 3)**
- Add frontmatter to all spec files
- Categorize all existing specs
- Add cross-references to related issues

**Phase 4: Establish Workflows (Week 4)**
- Document labeling workflows in CONTRIBUTING.md
- Create GitHub Actions for automated label management
- Train contributors on label usage

---

## Recommended Label Sets for Current Issues

### Critical Issues (Apply `priority:critical`)

Based on spec analysis:

1. **CRITICAL-001**: Implement query-need-axis!
   - Labels: `priority:critical`, `component:backend`, `type:feature`, `complexity:medium`, `milestone:3.5`
   - Related Spec: `spec/backend-issues/CRITICAL-001-implement-query-need-axis.md`

2. **TEST-001**: Fix test runner configuration
   - Labels: `priority:critical`, `component:testing`, `type:bug`, `complexity:small`, `milestone:3.5`
   - Related Spec: `spec/backend-issues/TEST-001-fix-test-runner.md`

3. **SECURITY-001**: Input validation for WebSocket messages
   - Labels: `priority:critical`, `component:backend`, `type:security`, `complexity:large`, `milestone:3`
   - Related Spec: `spec/backend-issues/SECURITY-001-input-validation.md`

### High Priority Issues (Apply `priority:high`)

Based on spec analysis:

1. **ARCH-001**: Split jobs.clj into separate files
   - Labels: `priority:high`, `component:backend`, `type:refactor`, `complexity:large`
   - Related Spec: `spec/backend-issues/ARCH-001-split-jobs-clj.md`

2. **PERF-001**: Optimize frontend performance
   - Labels: `priority:high`, `component:frontend`, `type:performance`, `complexity:large`
   - Related Spec: `spec/2026-01-22-frontend-code-review-recommendations.md`

3. **ARCH-002**: Add docstrings
   - Labels: `priority:high`, `component:backend`, `type:documentation`, `complexity:medium`
   - Related Spec: `spec/backend-issues/ARCH-002-add-docstrings.md`

### Medium Priority Issues (Apply `priority:medium`)

1. **STYLE-001**: Replace magic numbers with constants
   - Labels: `priority:medium`, `component:backend`, `type:refactor`, `complexity:medium`
   - Related Spec: `spec/backend-issues/STYLE-001-magic-numbers.md`

2. **ECS Migration** (6 phases)
   - Labels: `priority:high`, `component:ecs`, `type:refactor`, `complexity:xlarge`, `milestone:3.5`
   - Related Spec: `spec/issues/ecs-migration/*`

---

## Label Configuration Commands

### Creating Labels via GitHub CLI

```bash
# Priority labels
gh label create "priority:critical" --color "d73a4a" --description "Blocks development or production"
gh label create "priority:high" --color "ffa500" --description "Important but not blocking"
gh label create "priority:medium" --color "f7dc6f" --description "Normal priority"
gh label create "priority:low" --color "b9f6ca" --description "Nice to have"

# Component labels
gh label create "component:backend" --color "0052cc" --description "Backend/Clojure code"
gh label create "component:frontend" --color "0366d6" --description "Frontend/TypeScript code"
gh label create "component:testing" --color "7057ff" --description "Test infrastructure"
gh label create "component:ecs" --color "d4c5f9" --description "Entity-Component-System"
gh label create "component:myth" --color "a2eeef" --description "Myth engine and miracles"
gh label create "component:champion" --color "fbca04" --description "Champion control and agency"
gh label create "component:factions" --color "009874" --description "Faction AI and diplomacy"
gh label create "component:world" --color "bf0fff" --description "World geometry and LOD"

# Type labels
gh label create "type:bug" --color "d93f0b" --description "Defect in existing functionality"
gh label create "type:feature" --color "a2eeef" --description "New functionality to implement"
gh label create "type:refactor" --color "fbca04" --description "Code restructuring"
gh label create "type:performance" --color "5319e7" --description "Optimization work"
gh label create "type:security" --color "d93f0b" --description "Security fixes"
gh label create "type:documentation" --color "0075ca" --description "Documentation improvements"
gh label create "type:design" --color "bf0fff" --description "Design and architecture"
gh label create "type:testing" --color "0052cc" --description "Test-related work"
gh label create "type:task" --color "006b75" --description "General work item"

# Status labels
gh label create "status:proposed" --color "d4c5f9" --description "Not yet started"
gh label create "status:active" --color "fbca04" --description "Currently being worked on"
gh label create "status:in-review" --color "009874" --description "PR submitted, awaiting review"
gh label create "status:blocked" --color "d93f0b" --description "Blocked by another issue"
gh label create "status:waiting" --color "f4db8d" --description "Waiting on external factor"
gh label create "status:done" --color "b9f6ca" --description "Completed and merged"

# Complexity labels
gh label create "complexity:trivial" --color "b9f6ca" --description "< 1 hour"
gh label create "complexity:small" --color "b9f6ca" --description "1-4 hours"
gh label create "complexity:medium" --color "f7dc6f" --description "4-8 hours"
gh label create "complexity:large" --color "ffa500" --description "8-16 hours"
gh label create "complexity:xlarge" --color "d93f0b" --description "> 16 hours"

# Milestone labels
gh label create "milestone:1" --color "009874" --description "Hex Map Backbone"
gh label create "milestone:2" --color "009874" --description "Walls, Pathing, Build Ghosts"
gh label create "milestone:3" --color "009874" --description "Colony Job Loop"
gh label create "milestone:3.5" --color "009874" --description "Spatial Facets & Memory"
gh label create "milestone:4" --color "009874" --description "Champion Control & Day/Night"
gh label create "milestone:5" --color "009874" --description "Six Neighbor Factions"
gh label create "milestone:6" --color "009874" --description "Decks, Signs, Collisions"
gh label create "milestone:7" --color "009874" --description "Myth Integration"
```

---

## Definition of Done

### Label System Implementation

- [ ] All proposed labels created in GitHub repository
- [ ] Label colors configured according to specification
- [ ] Label descriptions added for all labels
- [ ] Existing issues labeled with appropriate labels
- [ ] All spec files updated with frontmatter
- [ ] Cross-references established between issues and specs
- [ ] CONTRIBUTING.md updated with labeling guidelines
- [ ] GitHub Actions configured for automated label management (optional)

### Training and Adoption

- [ ] Team briefed on label system
- [ ] Examples of properly labeled issues provided
- [ ] Examples of properly formatted specs provided
- [ ] Review process updated to check for proper labeling

---

## References

- Current GitHub issues: `gh issue list --state all`
- Spec files: `spec/` directory
- Code review: `spec/backend-code-review-2026-01-22.md`
- Frontend review: `spec/2026-01-22-frontend-code-review-recommendations.md`
- Milestone status: `spec/2026-01-22-milestone3.5-final-report.md`

---

## Change Log

### 2026-01-22
- Initial version of labeling system
- Analysis of all spec files completed
- Cross-reference with GitHub issues completed
- Label categories and definitions established
- Migration plan outlined
- GitHub CLI commands for label creation provided
