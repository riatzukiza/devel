export type SessionMirrorRecord = {
  createdAt: number;
  processId: number;
};

type ParsedSessionRecord = {
  processId?: number;
  createdAt?: number;
};

export type UnknownSessionDecision =
  | { action: "missing" }
  | { action: "allow"; touchOnly: true }
  | { action: "allow"; touchOnly: false; nextRecord: SessionMirrorRecord }
  | { action: "conflict" };

function parseSessionRecord(raw: string): ParsedSessionRecord | null {
  try {
    return JSON.parse(raw) as ParsedSessionRecord;
  } catch {
    return null;
  }
}

export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno?.code === "EPERM") {
      return true;
    }
    return false;
  }
}

export function decideUnknownSession(
  rawRecord: string | null,
  currentPid: number,
  nowMs = Date.now(),
  pidIsAlive: (pid: number) => boolean = isPidAlive,
): UnknownSessionDecision {
  if (!rawRecord) {
    return { action: "missing" };
  }

  const parsed = parseSessionRecord(rawRecord);
  const ownerPid = parsed?.processId;
  const hasOwnerPid = typeof ownerPid === "number" && Number.isInteger(ownerPid) && ownerPid > 0;

  if (hasOwnerPid && ownerPid === currentPid) {
    return { action: "allow", touchOnly: true };
  }

  if (hasOwnerPid && !pidIsAlive(ownerPid)) {
    return {
      action: "allow",
      touchOnly: false,
      nextRecord: {
        createdAt: parsed?.createdAt ?? nowMs,
        processId: currentPid,
      },
    };
  }

  return { action: "conflict" };
}
