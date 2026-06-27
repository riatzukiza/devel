export interface Entity {
  /** Unique identifier */
  id: string;
  /** Optional key for pinning/comparison */
  key?: string;
  /** Display title */
  title: string;
  /** Entity type */
  type?: string;
  /** Text content */
  text?: string;
  /** Time display string */
  time?: string;
  /** Timestamp for sorting */
  timestamp?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface PinnedEntry {
  /** Unique key for this pinned entry */
  key: string;
  /** The pinned entity */
  selection: Entity;
  /** Related context entities */
  context?: Entity[];
}

export interface ErrorState {
  /** Error message to display */
  message: string;
  /** Whether retry is available */
  retryable?: boolean;
}

export function getEntityKey(entity: Entity): string {
  return entity.key || entity.id || String(entity);
}
