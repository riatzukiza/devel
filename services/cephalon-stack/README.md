# Cephalon Stack

Container-first shared-context runtime for Cephalon.

This stack runs the ClojureScript Cephalon process inside a PM2-managed container with the TypeScript bridge enabled, exposing the memory UI on port `3000` and using MongoDB for persistence.

The container mounts the workspace at `/workspace` so the running process sees the live repository while the service group stays isolated from host PM2.
