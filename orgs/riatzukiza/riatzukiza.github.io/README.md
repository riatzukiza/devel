# game-of-life

**Interactive WebGL demos and game simulations powered by a custom ECS engine**

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-121013?logo=github)](https://riatzukiza.github.io)

## Overview

A GitHub Pages portfolio site showcasing interactive WebGL demos built with Sibilant (a Lisp-to-JavaScript compiler) and a custom Entity-Component-System (ECS) game engine. Features physics simulations, data structure visualizations, and experimental graphics.

## Projects

| Project | Description |
|---------|-------------|
| **colliding-particles** | Physics simulation with particle collisions |
| **crash-landed** | World generation with noise-based terrain |
| **obstacles** | Ant colony simulation with foraging behavior |
| **red-black-tree-visualization** | Interactive data structure visualization |
| **simple-gravity** | Basic physics gravity demo |
| **fluid** | Fluid dynamics simulation |

## Tech Stack

- **Language**: Sibilant → JavaScript (Lisp dialect)
- **Graphics**: WebGL via custom wrapper
- **Architecture**: Custom ECS (Entity-Component-System) engine
- **Tools**: Browserify, PM2, Obsidian
- **Libraries**: Ramda, Quadtree-js, Mousetrap

## Architecture

### ECS Engine
- Entity-Component-System architecture with typed arrays
- Systems: physics, collision, rendering, velocity, position
- Double-buffered state management for performance
- Event-driven ticker loop (60fps default)
- Web worker support for parallel processing
- Shader-based rendering system

### Directory Structure
```
/src          ← Sibilant source (client/server/shared)
  /client      ← Game-specific logic
  /shared      ← ECS engine, data structures, systems, math, pooling
  /server      ← Node.js app serving static files
/static       ← Compiled HTML/JS/CSS (deployed to GitHub Pages)
/inc          ← Sibilant macros and includes
/shaders      ← GLSL shaders
/docs         ← Auto-generated documentation
/notes        ← Obsidian vault (kanban, daily notes, tasks)
```

## Development

### Prerequisites
- Node.js
- PM2: `npm install -g pm2`
- Kit: Install from `package.json` dependencies

### Setup
```bash
npm install
```

### Running

Start the development server:
```bash
npm run dev:server
npm run dev:watch
```

Or run everything:
```bash
npm run dev
```

### Available Scripts
- `npm run dev:server` - Start server via PM2
- `npm run dev:watch` - Watch Sibilant files, auto-compile
- `npm run dev` - Full dev environment
- `npm run bundles` - Bundle dependencies with Browserify
- `npm run dev:logs` - View PM2 logs
- `npm start` - Start production server

### Deployment

GitHub Actions automatically deploys `/static` to GitHub Pages on push to `main`.

## Key Patterns

- **Namespace isolation**: Each game uses `(namespace game-name)`
- **Component composition**: Entities composed from systems (Collision, Physics, Velocity, etc.)
- **Event-driven**: Systems respond to ticker events ('tick', 'start')
- **Object pooling**: Custom pooling system for performance

## Documentation

Project management is tracked in Obsidian:
- [Kanban board](kanban/board.md) - Project progress
- [Tasks](kanban/tasks/) - Detailed task tracking
- [Daily notes](notes/daily/) - Development logs

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
