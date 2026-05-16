# Proxx policy contracts

This directory is deployment-owned policy configuration for the Proxx CLJS contract runtime.

The shadow compose overlay mounts it read-only at `/etc/proxx/policies` and sets:

```env
PROXX_CLJS_POLICY_MANIFEST=/etc/proxx/policies/runtime/00-manifest.edn
```

Policy-only updates should be made here (or in an equivalent Compose/Kubernetes mounted config directory) rather than by rebuilding the Proxx image. The current CLJS preview path reads the manifest and ordered EDN files on each preview call, so the next request observes valid file changes without a process restart.

## Pricing override commandment (token costs)

Token-price overrides MUST be expressed as EDN policy contracts.

- File: `runtime/15-model-pricing-overrides.edn`
- Loaded via: `runtime/00-manifest.edn`

Do **not** introduce pricing override JSON files, and do **not** hard-code one-off token prices in TypeScript.

For production, validate edits before rollout and prefer atomic directory/file replacement so readers never see partially-written EDN.
