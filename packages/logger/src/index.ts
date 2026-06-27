export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type Logger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export type CreateLoggerOptions = {
  name?: string;
  level?: LogLevel;
};

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(current: LogLevel, want: LogLevel): boolean {
  return LEVEL_RANK[want] >= LEVEL_RANK[current];
}

/**
 * Minimal logger used to unblock workspace builds.
 *
 * If you already have a richer logger in Promethean, swap this package
 * for the real implementation.
 */
export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const prefix = opts.name ? `[${opts.name}]` : '';
  const level = opts.level ?? 'info';

  return {
    debug: (...args) => { if (shouldLog(level, 'debug')) console.debug(prefix, ...args); },
    info: (...args) => { if (shouldLog(level, 'info')) console.info(prefix, ...args); },
    warn: (...args) => { if (shouldLog(level, 'warn')) console.warn(prefix, ...args); },
    error: (...args) => { if (shouldLog(level, 'error')) console.error(prefix, ...args); },
  };
}
