---
uuid: "a9978a25-4237-48ac-a575-278bc96ee9e3"
title: "Overview"
slug: "openplanner-overview"
status: "icebox"
priority: "P2"
labels: ["overview", "stores", "events", "project"]
created_at: "2026-02-04T13:36:54Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# Overview

This project is an **API-first** skeleton for a portable archive/data-lake:

- ingests “events” (messages, tool calls/results, derived artifacts)
- stores events in **DuckDB**
- stores vectors in **ChromaDB**
- stores binary attachments in a content-addressed **blob store**

The goal is to make ChatGPT exports + OpenCode sessions searchable and usable by multiple programs.

It intentionally avoids:
- coupling to any single UI
- relying on giant prompts / hidden context
