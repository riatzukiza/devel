# Validation Contract — Mission Control for the News

> Stable assertion catalogue for the threat-radar dashboard platform.
> Every item has a unique ID, a behavioural pass/fail condition, and explicit evidence requirements.
> Items are grouped by functional area, then followed by cross-area end-to-end flows.

---

## Area: Package Infrastructure

### VAL-PKG-001 — All Packages Build Successfully

**Description:** Running `pnpm build` (or the workspace-level build command) from the repository root completes with exit code 0 for every package in the workspace.

**Pass condition:** Zero build errors across `radar-core`, `threat-radar-mcp`, `threat-radar-web`, `signal-atproto`, and `signal-embed-browser`.

**Evidence:**
- CI build log showing exit code 0 for each package.
- Local reproduction: `pnpm -r run build` succeeds with no errors.

---

### VAL-PKG-002 — Workspace Linking Resolves All Internal Dependencies

**Description:** After a clean `pnpm install`, every internal cross-package import resolves without "module not found" or "cannot resolve" errors.

**Pass condition:** `pnpm install` exits 0 and subsequent `tsc --noEmit` in each consuming package produces no unresolved-module diagnostics.

**Evidence:**
- `pnpm install` stdout/stderr log with exit code 0.
- `tsc --noEmit` output for every downstream package showing zero errors.

---

### VAL-PKG-003 — radar-core Exports Core Types

**Description:** The `@workspace/radar-core` package exports the types `SignalEvent`, `Thread`, `ConnectionOpportunity`, and `ActionCard` such that downstream packages can import and type-check against them.

**Pass condition:** A downstream package importing `{ SignalEvent, Thread, ConnectionOpportunity, ActionCard }` from `@workspace/radar-core` passes `tsc --noEmit` with no errors.

**Evidence:**
- `tsc --noEmit` output from at least one downstream package that imports all four types.
- Source snippet showing the import statement.

---

### VAL-PKG-004 — Unit Tests Pass for radar-core Schemas and Reducer

**Description:** The test suite for `@workspace/radar-core` covering schema validation and the deterministic reducer runs to completion with all tests passing.

**Pass condition:** Test runner exits 0 with no failures or skipped-by-error tests.

**Evidence:**
- Test runner output showing pass count and zero failures.
- Coverage report (if configured) showing reducer and schema files are exercised.

---

### VAL-PKG-005 — Unit Tests Pass for signal-atproto Converters

**Description:** The test suite for the `signal-atproto` package covering AT Protocol record conversion logic runs to completion with all tests passing.

**Pass condition:** Test runner exits 0 with no failures.

**Evidence:**
- Test runner output showing pass count and zero failures.

---

## Area: Signal Collection

### VAL-COL-001 — Bluesky Collector Returns SignalEvents

**Description:** Invoking the `radar_collect_bluesky` MCP tool with a valid search query returns an array of objects that conform to the `SignalEvent` schema.

**Pass condition:** The tool returns at least one `SignalEvent` with populated `id`, `source`, `timestamp`, `content`, and `canonical_url` fields. Each returned object passes `SignalEvent` schema validation.

**Evidence:**
- MCP tool invocation log showing the request and response payload.
- Schema validation output confirming each returned object is a valid `SignalEvent`.

---

### VAL-COL-002 — Reddit Collector Returns SignalEvents

**Description:** Invoking the `radar_collect_reddit` MCP tool with a valid subreddit name returns an array of objects that conform to the `SignalEvent` schema.

**Pass condition:** The tool returns at least one `SignalEvent` with populated `id`, `source`, `timestamp`, `content`, and `canonical_url` fields. Each returned object passes `SignalEvent` schema validation.

**Evidence:**
- MCP tool invocation log showing the request and response payload.
- Schema validation output confirming each returned object is a valid `SignalEvent`.

---

### VAL-COL-003 — Collected Signals Persist to Postgres

**Description:** After collecting signals via either collector tool, the signals are written to the Postgres database and remain available after the MCP server process is restarted.

**Pass condition:** (1) Collect signals. (2) Query Postgres and confirm rows exist. (3) Restart the server process. (4) Query Postgres again and confirm the same rows are still present.

**Evidence:**
- SQL query result before and after server restart showing identical signal rows.
- Server restart log showing clean shutdown and startup.

---

### VAL-COL-004 — Duplicate Signal Detection

**Description:** When a signal with the same canonical URL as an existing persisted signal is collected, the system detects the duplicate and does not create a second row in storage.

**Pass condition:** Collecting the same signal twice results in exactly one row in Postgres for that canonical URL. The second collection either returns a "duplicate detected" indicator or silently deduplicates.

**Evidence:**
- SQL `SELECT count(*) FROM signals WHERE canonical_url = '<url>'` returning 1 after two collection attempts.
- Application log or tool response indicating deduplication occurred.

---

## Area: Signal Processing

### VAL-PROC-001 — SignalEvents Clustered into Threads

**Description:** Raw `SignalEvent` objects are grouped into `Thread` objects based on semantic similarity, so that signals about the same topic or event appear in the same thread.

**Pass condition:** Given at least 3 signals on topic A and 2 signals on topic B, the system produces at least 2 distinct `Thread` objects, with topic-A signals in one thread and topic-B signals in the other.

**Evidence:**
- Thread output showing member signal IDs grouped correctly.
- Semantic similarity scores (if logged) confirming intra-thread similarity exceeds inter-thread similarity.

---

### VAL-PROC-002 — Reducer Produces Bounded Score Ranges

**Description:** The deterministic reducer produces score outputs as bounded ranges (lower, upper) rather than single point estimates, reflecting uncertainty in the assessment.

**Pass condition:** Every score field in the reduced snapshot contains both a `lower` and `upper` value, where `lower <= upper` and both are within the configured scale (e.g., 0–100).

**Evidence:**
- Reduced snapshot JSON showing range fields for every score dimension.
- Unit test asserting range bounds are present and valid.

---

### VAL-PROC-003 — Model Disagreement Index

**Description:** When multiple assessment packets from different models or agents are submitted for the same radar, the system computes a numeric disagreement index representing the degree of divergence.

**Pass condition:** Given at least 2 packets with differing scores for the same radar, the disagreement index is a finite number > 0. Given 2 identical packets, the disagreement index is 0.

**Evidence:**
- Snapshot output showing `disagreement_index` field with expected values for convergent and divergent inputs.
- Unit test covering both cases.

---

### VAL-PROC-004 — Live Snapshot Updates Without Overwriting Daily

**Description:** The live snapshot updates in real-time as new signals and packets arrive, but it does not modify or overwrite the sealed daily snapshot.

**Pass condition:** (1) Seal a daily snapshot. (2) Submit a new packet. (3) Observe the live snapshot changes. (4) Query the daily snapshot and confirm it is unchanged.

**Evidence:**
- Daily snapshot `as_of_utc` and content before and after live update, showing no change.
- Live snapshot showing updated values after new packet submission.

---

### VAL-PROC-005 — Daily Snapshot Sealing

**Description:** The daily snapshot sealing operation produces an immutable historical record with a UTC timestamp that cannot be modified by subsequent operations.

**Pass condition:** After sealing, the daily snapshot row has `snapshot_kind = 'daily'`, a valid `as_of_utc` timestamp, and any subsequent reduction or packet submission does not alter its content.

**Evidence:**
- SQL query showing the sealed snapshot row with expected fields.
- Attempt to re-seal or modify the same day's snapshot fails or is rejected.
- Subsequent live updates leave the daily row unchanged.

---

## Area: Data Distribution

### VAL-DATA-001 — Radar Configuration Persists via Postgres

**Description:** Radar configuration (name, slug, category, sources, module version, render profile) persists in Postgres and survives server restarts.

**Pass condition:** (1) Create or update a radar configuration. (2) Restart the server. (3) Query the configuration and confirm it matches the pre-restart state.

**Evidence:**
- Configuration query results before and after restart are identical.
- Server startup log showing configuration loaded from Postgres.

---

### VAL-DATA-002 — SignalEvents Published as AT Protocol Records

**Description:** Collected `SignalEvent` objects are published as AT Protocol records via the `signal-atproto` package.

**Pass condition:** For each persisted `SignalEvent`, a corresponding AT Protocol record exists with matching content fields. The `signal-atproto` converter produces a valid AT Protocol record that passes lexicon validation.

**Evidence:**
- AT Protocol record output or log showing the published record.
- Lexicon validation output confirming schema compliance.

---

### VAL-DATA-003 — Threads Published as AT Protocol Records

**Description:** `Thread` objects are published as AT Protocol records via `signal-atproto`.

**Pass condition:** For each `Thread`, a corresponding AT Protocol record exists containing the thread ID, member signal references, and thread metadata.

**Evidence:**
- AT Protocol record output showing thread data.
- Lexicon validation confirming schema compliance.

---

### VAL-DATA-004 — Reduced Snapshots Published as AT Protocol Records

**Description:** Reduced snapshot objects (both live and daily) are published as AT Protocol records via `signal-atproto`.

**Pass condition:** For each reduced snapshot, a corresponding AT Protocol record exists containing all score ranges, branches, and metadata.

**Evidence:**
- AT Protocol record output showing snapshot data.
- Lexicon validation confirming schema compliance.

---

## Area: Dashboard Core UI

### VAL-UI-001 — Dashboard Loads and Displays a Radar

**Description:** Navigating to the root URL (`/`) loads the dashboard application and displays at least one radar with visible clock or gauge elements.

**Pass condition:** The page renders without JavaScript errors in the console, and at least one radar element (clock face, gauge, or thread card) is visible in the DOM.

**Evidence:**
- Screenshot of the loaded dashboard.
- Browser console log showing no uncaught errors.
- DOM inspection confirming radar element presence.

---

### VAL-UI-002 — Hero Panel Ring Gauges

**Description:** The hero panel displays 3 animated ring gauges labeled "Agency", "Nuance", and "Critical", each showing a value in the range 0–100.

**Pass condition:** All three gauges are rendered as ring/arc shapes, each displays a numeric label in [0, 100], and the rings animate on load or data change.

**Evidence:**
- Screenshot showing all 3 labeled ring gauges with numeric values.
- DOM inspection confirming 3 SVG/Canvas gauge elements with appropriate labels.

---

### VAL-UI-003 — Composite Stress Clock

**Description:** A composite stress clock renders with an animated sweep hand and an uncertainty arc representing the bounded score range.

**Pass condition:** The clock face is visible, the sweep hand moves or transitions on data updates, and the uncertainty arc spans a visible angular range proportional to the score range width.

**Evidence:**
- Screenshot or video capture showing the sweep hand and uncertainty arc.
- DOM/Canvas inspection confirming animated elements.

---

### VAL-UI-004 — Source Firehose Panel

**Description:** The source firehose panel displays live signal intake items as they arrive, each tagged with freshness and quality indicators.

**Pass condition:** At least one signal item is visible in the firehose, showing a source label, timestamp-derived freshness tag (e.g., "2m ago"), and a quality indicator (e.g., "high", "medium", "low" or a numeric badge).

**Evidence:**
- Screenshot showing firehose items with tags.
- DOM inspection confirming freshness and quality elements per item.

---

### VAL-UI-005 — Personalization Sliders Persist

**Description:** The dashboard includes sliders for Bluesky weight, Reddit weight, and alert intensity. Adjusting a slider updates its value, and the values persist across page refreshes.

**Pass condition:** (1) Adjust each slider to a non-default value. (2) Refresh the page. (3) Each slider retains the adjusted value.

**Evidence:**
- Screenshot or DOM inspection showing slider values before and after refresh.
- Network log or localStorage/API inspection confirming persistence mechanism.

---

### VAL-UI-006 — Critical Thinking Section

**Description:** The dashboard includes a critical thinking section that provides guidance about evaluating sources, recognizing bias, and resisting narrative collapse.

**Pass condition:** The section is visible on the dashboard, contains at least one paragraph of guidance text, and references concepts like source evaluation, bias awareness, or narrative collapse.

**Evidence:**
- Screenshot showing the critical thinking section with guidance text.
- DOM inspection confirming the section's presence and content.

---

### VAL-UI-007 — Action Feed with Time-Bounded Suggestions

**Description:** The dashboard action feed displays at least one suggestion with a time horizon (e.g., "within 24 hours", "this week", "coordination opportunity").

**Pass condition:** At least one action item is visible with a time-bound label.

**Evidence:**
- Screenshot showing the action feed with at least one time-bounded suggestion.
- DOM inspection confirming action item elements with time labels.

---

### VAL-UI-008 — Dark Theme Rendering

**Description:** The dashboard renders with a dark theme including gradient backgrounds, with no visual defects such as white flashes on load, broken gradient transitions, or un-themed elements.

**Pass condition:** (1) Page loads without any visible white flash. (2) All background gradients render smoothly. (3) No element appears with a default white/light background that breaks the dark theme.

**Evidence:**
- Screenshot showing fully dark-themed layout.
- Slow-motion page load capture (or paint timing logs) confirming no white flash.
- Visual review confirming no broken gradients.

---

## Area: Dashboard η (Global) Lane

### VAL-ETA-001 — Global Lane Renders with Cyan Accent

**Description:** The η (Global) lane column renders as a distinct column with cyan accent color and a visible η icon or label.

**Pass condition:** The column is visible, its accent color is in the cyan family (hue approximately 180°), and the η symbol is present as text or icon.

**Evidence:**
- Screenshot showing the η column with cyan styling.
- CSS inspection confirming cyan-range color values.

---

### VAL-ETA-002 — Thread Cards with Gauges

**Description:** Each thread card in the η lane displays a title, subtitle, and at least 2 gauge bars showing numeric values.

**Pass condition:** At least one thread card is visible with a title string, a subtitle string, and ≥ 2 horizontal or radial gauge elements each displaying a value.

**Evidence:**
- Screenshot showing a thread card with title, subtitle, and gauge bars.
- DOM inspection confirming gauge value elements.

---

### VAL-ETA-003 — Narrative Branches

**Description:** Each thread in the η lane includes a narrative branch section showing at least 2 competing interpretations.

**Pass condition:** At least one thread card contains a "narrative branches" or equivalent section with ≥ 2 distinct interpretation labels or descriptions.

**Evidence:**
- Screenshot showing narrative branch section with multiple interpretations.
- DOM inspection confirming ≥ 2 branch elements.

---

### VAL-ETA-004 — Source Provenance Badges

**Description:** Each thread card in the η lane displays source badges identifying the provenance of contributing signals.

**Pass condition:** At least one thread card shows ≥ 1 source badge (e.g., "Reuters", "Bluesky", "Reddit") rendered as a label, pill, or icon.

**Evidence:**
- Screenshot showing source badges on a thread card.
- DOM inspection confirming badge elements with source text.

---

### VAL-ETA-005 — Uncertainty Labels

**Description:** Each thread in the η lane displays an uncertainty/disagreement label indicating the level of model disagreement.

**Pass condition:** At least one thread card shows an uncertainty label reading one of: "low", "moderate", or "high" (or equivalent graduated scale).

**Evidence:**
- Screenshot showing an uncertainty label on a thread card.
- DOM inspection confirming the label element and its text content.

---

## Area: Dashboard μ (Local) Lane

### VAL-MU-001 — Local Lane Renders with Emerald Accent

**Description:** The μ (Local) lane column renders as a distinct column with emerald/green accent color and a visible μ icon or label.

**Pass condition:** The column is visible, its accent color is in the emerald/green family (hue approximately 140–160°), and the μ symbol is present.

**Evidence:**
- Screenshot showing the μ column with emerald styling.
- CSS inspection confirming green-range color values.

---

### VAL-MU-002 — Proximity and Leverage Indicators

**Description:** Thread cards in the μ lane show proximity and leverage indicators such as "High leverage", "Medium leverage", "Act within days", "Act within weeks".

**Pass condition:** At least one thread card displays both a leverage level (e.g., "High", "Medium") and a time-to-act indicator (e.g., "days", "weeks").

**Evidence:**
- Screenshot showing proximity and leverage labels on a thread card.
- DOM inspection confirming indicator elements.

---

### VAL-MU-003 — Action Suggestions per Local Thread

**Description:** Each local thread card includes at least 2 specific action suggestions relevant to the local context.

**Pass condition:** At least one thread card contains an action list with ≥ 2 distinct action items, each describing a concrete step.

**Evidence:**
- Screenshot showing action suggestions within a thread card.
- DOM inspection confirming ≥ 2 action item elements.

---

### VAL-MU-004 — Community Readiness Gauges

**Description:** The μ lane includes community readiness gauges reflecting local signal state, rendered as progress bars or similar visual indicators.

**Pass condition:** At least one readiness gauge is visible with a progress bar or fill indicator and a label indicating the readiness dimension.

**Evidence:**
- Screenshot showing community readiness gauges with progress fills.
- DOM inspection confirming progress bar elements.

---

## Area: Dashboard Π (Connections) Lane

### VAL-PI-001 — Connections Lane Renders with Fuchsia Accent

**Description:** The Π (Connections) lane column renders as a distinct column with fuchsia/magenta accent color and a visible Π icon or label.

**Pass condition:** The column is visible, its accent color is in the fuchsia/magenta family (hue approximately 290–320°), and the Π symbol is present.

**Evidence:**
- Screenshot showing the Π column with fuchsia styling.
- CSS inspection confirming fuchsia-range color values.

---

### VAL-PI-002 — Bridge Card Scores

**Description:** Each bridge card in the Π lane displays numeric scores for realism, fear, and public benefit.

**Pass condition:** At least one bridge card shows 3 labeled numeric values: realism, fear, and public benefit.

**Evidence:**
- Screenshot showing a bridge card with the 3 labeled scores.
- DOM inspection confirming score value elements.

---

### VAL-PI-003 — Bridge Card Local Action

**Description:** Each bridge card includes a section suggesting a specific local action derived from the connection opportunity.

**Pass condition:** At least one bridge card contains a "suggested action" or equivalent section with actionable text.

**Evidence:**
- Screenshot showing the local action section within a bridge card.
- DOM inspection confirming the action section element and its content.

---

### VAL-PI-004 — Federated Coordination Path

**Description:** Each bridge card includes a description of a federated coordination path, indicating how local actions connect to broader coordination networks.

**Pass condition:** At least one bridge card contains a "coordination path" or equivalent section with descriptive text referencing multi-node or cross-community coordination.

**Evidence:**
- Screenshot showing the federated coordination path section.
- DOM inspection confirming the section element and its content.

---

### VAL-PI-005 — Feedback Loop Visualization

**Description:** The Π lane renders a P→R→N→Π→A→feedback loop visualization as a labeled diagram showing the flow from Perception through Reduction, Narrative, Connection, Action, and back.

**Pass condition:** A diagram element is visible showing at least 5 labeled nodes (P, R, N, Π, A) connected by arrows or flow lines, forming a cycle.

**Evidence:**
- Screenshot showing the labeled loop diagram.
- DOM/SVG inspection confirming node and edge elements.

---

## Area: Connection Engine

### VAL-CONN-001 — ConnectionOpportunity Generation

**Description:** The connection engine generates `ConnectionOpportunity` objects that link a global thread to at least one local action.

**Pass condition:** Given at least one global thread and one local thread, the engine produces a `ConnectionOpportunity` referencing the global thread ID and containing ≥ 1 local action reference.

**Evidence:**
- ConnectionOpportunity output showing `global_thread_id` and `local_actions[]` fields.
- Unit test confirming generation from test inputs.

---

### VAL-CONN-002 — ActionCard Field Completeness

**Description:** Each `ActionCard` created by the connection engine includes all required fields: scope, effort, expected benefit, risk, and feedback metric.

**Pass condition:** Every generated `ActionCard` has non-empty values for `scope`, `effort`, `expected_benefit`, `risk`, and `feedback_metric`.

**Evidence:**
- ActionCard JSON output showing all 5 fields populated.
- Unit test asserting all fields are present and non-empty.

---

### VAL-CONN-003 — Narrative Branch Scoring

**Description:** Narrative branches are scored with at least 4 of the following dimensions: realism, fear, public benefit, actionability, polarization risk, compression loss.

**Pass condition:** Each narrative branch object contains ≥ 4 scored dimensions from the listed set, each with a numeric value.

**Evidence:**
- Narrative branch output showing ≥ 4 dimension scores.
- Unit test confirming the scoring dimensions.

---

## Area: Browser Compute

### VAL-BROWSER-001 — Browser-Side Cosine Similarity via ONNX

**Description:** The `signal-embed-browser` package computes a cosine similarity matrix in the browser using an ONNX runtime, enabling client-side signal comparison without server round-trips.

**Pass condition:** Given ≥ 2 signal embeddings, the browser computes a similarity matrix where diagonal entries are ~1.0 and off-diagonal entries are valid cosine similarities in [-1, 1].

**Evidence:**
- Browser console or test output showing the computed matrix.
- Unit/integration test in a browser-like environment confirming matrix properties.

---

### VAL-BROWSER-002 — WASM Fallback

**Description:** When WebGPU and WebNN are unavailable, the browser compute module falls back to a WASM backend for ONNX inference.

**Pass condition:** On a browser or environment without WebGPU/WebNN support, the ONNX inference still completes successfully using the WASM execution provider.

**Evidence:**
- Test log or console output showing WASM backend selected.
- Inference output matching expected results within tolerance.

---

### VAL-BROWSER-003 — Backend Detection Diagnostics

**Description:** The browser compute module detects available execution backends (WebGPU, WebNN, WASM) and reports them in a diagnostics object.

**Pass condition:** The diagnostics output lists each backend with a boolean availability flag. At least WASM reports as available on any modern browser.

**Evidence:**
- Diagnostics output showing backend availability flags.
- Test confirming the diagnostics object structure.

---

## Area: Federation

### VAL-FED-001 — Enso-Style Envelope Transport

**Description:** An Enso-style federation envelope can carry a thread assessment payload between two endpoints (nodes), enabling cross-instance data sharing.

**Pass condition:** A thread assessment is wrapped in an envelope, sent to a second endpoint, and received with its content intact and envelope metadata (sender, recipient, timestamp, signature/hash) present.

**Evidence:**
- Envelope payload showing wrapped assessment and metadata.
- Receiving endpoint log confirming successful deserialization.

---

### VAL-FED-002 — Federated Comparison Panel

**Description:** The federated comparison panel displays at least 2 peer node assessments side-by-side for the same thread, showing how different nodes evaluate the same situation.

**Pass condition:** The panel renders ≥ 2 columns, each labeled with a peer node identifier, showing that node's assessment values for a shared thread.

**Evidence:**
- Screenshot showing side-by-side peer assessments.
- DOM inspection confirming ≥ 2 peer columns with assessment data.

---

### VAL-FED-003 — Trust Circle Filtering

**Description:** The federation layer applies trust circle filtering so that data from untrusted peers is excluded from aggregation and display.

**Pass condition:** (1) Configure a trust circle that includes Peer A but excludes Peer B. (2) Receive assessments from both peers. (3) Only Peer A's assessment appears in the aggregated view; Peer B's is filtered out.

**Evidence:**
- Trust circle configuration showing inclusion/exclusion rules.
- Aggregated output or UI showing only trusted peer data.
- Log confirming Peer B's data was filtered.

---

## Cross-Area Flows

### VAL-CROSS-001 — End-to-End: Bluesky → η Lane Clock

**Description:** A Bluesky search query produces raw signals that are normalized into `SignalEvent` objects, clustered into a `Thread`, reduced into a snapshot, and ultimately displayed as a clock in the η (Global) lane.

**Pass condition:** Starting from a `radar_collect_bluesky` invocation, the pipeline terminates with a visible clock element in the η lane whose values correspond to the reduced snapshot.

**Evidence:**
- Collector output showing raw Bluesky signals.
- Normalized `SignalEvent` records in Postgres.
- `Thread` object referencing those signals.
- Reduced snapshot with score ranges.
- Screenshot showing the corresponding clock in the η lane.

---

### VAL-CROSS-002 — End-to-End: Reddit → η Lane Clock

**Description:** A Reddit subreddit collection produces raw signals that are normalized, clustered, reduced, and displayed as a clock in the η lane.

**Pass condition:** Starting from a `radar_collect_reddit` invocation, the pipeline terminates with a visible clock element in the η lane whose values correspond to the reduced snapshot.

**Evidence:**
- Collector output showing raw Reddit signals.
- Normalized `SignalEvent` records in Postgres.
- `Thread` object referencing those signals.
- Reduced snapshot with score ranges.
- Screenshot showing the corresponding clock in the η lane.

---

### VAL-CROSS-003 — Personalization Slider → Re-Render

**Description:** Changing a personalization slider (e.g., Bluesky weight) triggers an API call that updates the weighting, and the dashboard re-renders with adjusted values reflecting the new weights.

**Pass condition:** (1) Note current gauge/clock values. (2) Adjust a weight slider. (3) Observe an API call in the network log. (4) Gauge/clock values change to reflect the adjusted weights.

**Evidence:**
- Network log showing the API request with new weight value.
- Before/after screenshots or DOM snapshots showing changed gauge values.

---

### VAL-CROSS-004 — Global Signal → Π Lane Action

**Description:** A global signal leads to a `ConnectionOpportunity` linking it to a local context, which produces an `ActionCard` that appears both in the Π lane and the dashboard action feed.

**Pass condition:** A `ConnectionOpportunity` references a global thread. An `ActionCard` derived from it appears in the Π lane as a bridge card and in the action feed as a suggestion item.

**Evidence:**
- ConnectionOpportunity JSON showing global thread linkage.
- ActionCard JSON with all required fields.
- Screenshot showing the bridge card in the Π lane.
- Screenshot showing the corresponding action in the action feed.

---

### VAL-CROSS-005 — First Visit Flow

**Description:** A first-time user loads the root URL and sees a fully rendered dashboard with default configuration, all 3 lanes visible, and at least one radar displayed.

**Pass condition:** (1) Clear all local state (cookies, localStorage). (2) Navigate to `/`. (3) The dashboard renders with default settings, 3 lane columns are visible, and at least one radar clock/gauge is displayed.

**Evidence:**
- Screenshot from a clean browser session showing the full dashboard.
- DOM inspection confirming 3 lane columns and ≥ 1 radar element.
- Console log showing no errors on initial load.

---

### VAL-CROSS-006 — Single-Page Layout — All Lanes Reachable Without Navigation

**Description:** All 3 lanes (η, μ, Π) are reachable from the initial page load without client-side routing navigation. The dashboard is a single-page layout, not separate routes.

**Pass condition:** On initial load, all 3 lane columns are present in the DOM. No `<a>` navigation or route change is required to view any lane. Scrolling or viewport panning (if needed) reveals all lanes without a URL change.

**Evidence:**
- DOM inspection at load time confirming all 3 lane containers are present.
- URL bar remains unchanged when viewing any lane.
- Screenshot (or wide viewport capture) showing all 3 lanes in one layout.
