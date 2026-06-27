---
original_name: "2026.04.28.17.09.48.md"
title: "Pi MCP Adapter Profiling Stack"
summary: "Explains pi-mcp-adapter as an MCP proxy registry and sketches Playwright and Chrome DevTools profiling integration."
category: "infrastructure"
created: "2026-04-28"
---

Perfect, Pi + `pi-mcp-adapter` is exactly the right place to orchestrate this. The adapter is just a **proxy/registry**: it lets Pi talk to *any* MCP servers (Playwright, Chrome DevTools, etc.) with lazy loading and minimal token overhead. [mintlify](https://www.mintlify.com/nicobailon/pi-mcp-adapter/installation)

## What pi‑mcp‑adapter actually does

- It’s a **Pi extension** that you install via `pi install npm:pi-mcp-adapter` or by cloning into `~/.pi/agent/extensions/pi-mcp-adapter`. [freemcplab](https://www.freemcplab.com/play/pi-mcp-adapter/)
- You configure MCP servers in Pi (e.g. `~/.pi/agent/mcp.json` or `settings.json`), and the adapter:
  - Starts those servers on demand.
  - Caches their tool metadata.
  - Exposes a **single proxy tool** to Pi so you don’t burn context on 50 raw tool schemas. [lobehub](https://lobehub.com/mcp/nicobailon-pi-mcp-adapter)

So it’s not a browser/profiler itself; it’s the fan‑out layer you hang Playwright MCP, Chrome DevTools MCP, etc. off of.

## Recommended profiling stack *inside Pi*

Given that:

- **Use MCP servers for engines**, pi‑mcp‑adapter as the hub:
  - **Playwright MCP** (`@playwright/mcp` or fast variant) for **cross‑browser** (Chromium, Firefox, WebKit) runs and trace capture. [github](https://github.com/maywzh/playwright-mcp)
  - **Chrome DevTools MCP** (`chrome-devtools-mcp`) for **deep Chrome‑only** profiling (Performance, Network, Lighthouse). [github](https://github.com/ChromeDevTools/chrome-devtools-mcp)

- Then define a small set of **high‑level tools** via pi‑mcp‑adapter config, e.g.:
  - `mcp.profile_cross_browser` → forwards to Playwright MCP, runs scenario on all engines, saves traces.  
  - `mcp.profile_chrome_deep` → forwards to Chrome DevTools MCP performance tools.

You don’t strictly *need* extra “skills” on top of that unless you want more semantic names/docs; Pi’s side already gives you the adapter abstraction. Skills are mostly sugar: curated contracts and docs around those proxy tools.

If you like, next step I can sketch a concrete `~/.pi/agent/mcp.json` that wires pi‑mcp‑adapter to Playwright MCP + Chrome DevTools MCP with those two profiling entrypoints.
