const titleCase = (value: string): string =>
  value
    .split(/[_\s-]+/u)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export const defaultStatusOrder = [
  "icebox",
  "incoming",
  "accepted",
  "breakdown",
  "blocked",
  "ready",
  "todo",
  "in_progress",
  "in_review",
  "testing",
  "document",
  "done",
  "rejected"
] as const;

export type KanbanStatus = (typeof defaultStatusOrder)[number];

export const startStatuses: readonly KanbanStatus[] = ["icebox", "incoming"];

export const statusDisplayNames: Record<KanbanStatus, string> = {
  icebox: "Ice Box",
  incoming: "Incoming",
  accepted: "Accepted",
  breakdown: "Breakdown",
  blocked: "Blocked",
  ready: "Ready",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  testing: "Testing",
  document: "Document",
  done: "Done",
  rejected: "Rejected"
};

const canonicalStatusSet = new Set<string>(defaultStatusOrder);

const statusAliases: Record<string, KanbanStatus> = {
  ice_box: "icebox",
  inbox: "incoming",
  triage_pending: "incoming",
  approved: "accepted",
  validated: "accepted",
  committed: "accepted",
  on_hold: "blocked",
  blocked_on: "blocked",
  waiting: "blocked",
  stuck: "blocked",
  impeded: "blocked",
  to_do: "todo",
  backlog: "todo",
  ready_to_start: "todo",
  ready_for_dev: "ready",
  ready_for_work: "ready",
  triage: "ready",
  progress: "in_progress",
  doing: "in_progress",
  wip: "in_progress",
  inprocess: "in_progress",
  review: "in_review",
  qa_review: "in_review",
  peer_review: "in_review",
  ready_for_review: "in_review",
  code_review: "in_review",
  qa: "testing",
  in_testing: "testing",
  test: "testing",
  verification: "testing",
  docs: "document",
  documentation: "document",
  doc: "document",
  completed: "done",
  complete: "done",
  shipped: "done",
  released: "done",
  finished: "done"
};

export const kanbanTransitions: Readonly<Record<KanbanStatus, readonly KanbanStatus[]>> = {
  icebox: ["incoming"],
  incoming: ["accepted", "rejected", "icebox"],
  accepted: ["breakdown", "icebox"],
  breakdown: ["ready", "rejected", "icebox", "blocked"],
  blocked: ["breakdown"],
  ready: ["todo", "breakdown"],
  todo: ["in_progress", "breakdown"],
  in_progress: ["in_review", "todo", "breakdown"],
  in_review: ["testing", "in_progress", "todo", "breakdown"],
  testing: ["document", "in_progress", "in_review"],
  document: ["done", "in_review"],
  done: [],
  rejected: ["icebox"]
};

const sanitizeStatusToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^status:/u, "")
    .trim()
    .replace(/[\s-]+/gu, "_")
    .replace(/[^a-z0-9_]+/gu, "");

export const isCanonicalKanbanStatus = (value: string): value is KanbanStatus =>
  canonicalStatusSet.has(value);

export const normalizeKanbanStatus = (status: string | undefined): KanbanStatus | string => {
  if (!status) {
    return "incoming";
  }

  const sanitized = sanitizeStatusToken(status);
  if (sanitized.length === 0) {
    return "incoming";
  }

  if (isCanonicalKanbanStatus(sanitized)) {
    return sanitized;
  }

  return statusAliases[sanitized] ?? sanitized;
};

export const buildKanbanTitle = (status: string): string => {
  const normalized = normalizeKanbanStatus(status);
  if (isCanonicalKanbanStatus(normalized)) {
    return statusDisplayNames[normalized];
  }

  return titleCase(normalized);
};

export const getAllowedTransitions = (status: string): readonly KanbanStatus[] => {
  const normalized = normalizeKanbanStatus(status);
  if (!isCanonicalKanbanStatus(normalized)) {
    return [];
  }

  return kanbanTransitions[normalized];
};

export const canTransition = (from: string, to: string): boolean => {
  const normalizedFrom = normalizeKanbanStatus(from);
  const normalizedTo = normalizeKanbanStatus(to);

  if (!isCanonicalKanbanStatus(normalizedFrom) || !isCanonicalKanbanStatus(normalizedTo)) {
    return false;
  }

  return kanbanTransitions[normalizedFrom].includes(normalizedTo);
};

export const renderKanbanFsm = (): string => {
  const lines = [
    "OpenHax Kanban FSM",
    `Start states: ${startStatuses.map((status) => statusDisplayNames[status]).join(", ")}`,
    ""
  ];

  for (const status of defaultStatusOrder) {
    const targets = kanbanTransitions[status];
    lines.push(
      `${statusDisplayNames[status]} -> ${
        targets.length > 0 ? targets.map((target) => statusDisplayNames[target]).join(", ") : "(terminal)"
      }`
    );
  }

  return `${lines.join("\n")}\n`;
};

export const toKanbanStateLabel = (status: KanbanStatus): string => `state:${status}`;