# Project: game-of-life (GitHub Pages portfolio site)

**Lines of Code:** ~1,458 Sibilant files, 115MB static assets  
**Language:** Sibilant → JavaScript (Lisp dialect)

## Purpose

GitHub Pages site showcasing interactive WebGL demos and projects with game physics simulations, visualizations, and experimental graphics.

## Architecture

Custom Game Engine (ECS Pattern)
- Entity-Component-System architecture with typed arrays
- Systems: physics, collision, rendering, velocity, position
- Double-buffered state management for performance
- Event-driven ticker loop (60fps default)
- Web worker support for parallel processing
- Shader-based rendering system

## Tech Stack

- Sibilant: Lisp-to-JS compiler with 85+ macros (inc/)
- TypeScript: Type checking and declaration generation (JSDoc annotations)
- Kit Ecosystem: Custom JS modules (kit-http, kit-interface, kit-events, etc.)
- WebGL: Graphics via custom wrapper (webgl module)
- Ramda: Functional utilities
- PM2: Hot reload dev server (watching inc/, dev/, server/)
- Browserify: Dependency bundling
- Obsidian: Note-taking with plugins (kanban, git, tasks, etc.)

## Projects (5 Interactive Demos)

1. colliding-particles - Physics simulation with particle collisions
2. crash-landed - World generation with noise-based terrain
3. obstacles - Ant colony simulation with foraging behavior
4. red-black-tree-visualization - Data structure visualization
5. simple-gravity - Basic physics gravity demo

## Directory Structure

```
/src          ← Sibilant source (client/server/shared)
  /client      ← Game-specific logic
  /shared      ← ECS engine, data structures, systems, math, pooling
  /server      ← Node.js app serving static files
/static       ← Compiled HTML/JS/CSS (deployed to GitHub Pages)
/inc          ← Sibilant macros and includes
/shaders      ← GLSL shaders (sprite-atlas, mote, scaling)
/docs         ← Auto-generated documentation
/notes        ← Obsidian vault (kanban, daily notes, tasks)
/server       ← Node.js server
```

## Development Workflow

- `npm run dev:server` - Start server via PM2
- `npm run dev:watch` - Watch Sibilant files, auto-compile
- `npm run dev` - Full dev environment
- `npm run bundles` - Bundle dependencies with Browserify
- `npm run type-check` - Run TypeScript type checking (checks JSDoc annotations)
- GitHub Actions deploys /static to Pages on push to main

## Key Patterns

- Namespace isolation: Each game uses `(namespace game-name)`
- Component composition: Entities composed from systems (Collision, Physics, Velocity, etc.)
- Event-driven: Systems respond to ticker events ('tick', 'start')
- Object pooling: Custom pooling system for performance (src/shared/pooling/)
- Type safety via JSDoc: TypeScript type checking with JSDoc annotations on compiled JavaScript

## TypeScript Integration

- Type declarations in `/types/`: Custom type definitions for kit modules and global extensions
- JSDoc annotations: Added to server and shared code for type checking
- `tsconfig.json`: Configured for JSDoc type checking with `checkJs: false`
- No compilation to TypeScript: Runtime remains JavaScript, TypeScript used for type validation only

## Unique Features

- Full Lisp syntax for game development
- Custom ECS implementation with typed arrays
- Web worker support for parallel processing
- Shader-based rendering system
- Integration with Obsidian for project management
