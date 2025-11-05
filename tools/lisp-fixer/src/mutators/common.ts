// GPL-3.0-only
import { randomBytes } from "node:crypto";

export type Mutator = (code: string) => string;

export function pick<T>(xs: T[]): T {
  if (xs.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  const idx = randomBytes(4).readUInt32BE(0) % xs.length;
  return xs[idx]!;
}

export function replaceAt(s: string, i: number, repl: string): string {
  if (i < 0 || i >= s.length) {
    throw new Error(`Index ${i} out of bounds for string of length ${s.length}`);
  }
  return s.slice(0, i) + repl + s.slice(i + 1);
}

export function randomIndex(s: string, pred: (c: string) => boolean): number | null {
  const idxs = [...s].map((c, i) => [c, i] as const).filter(([c]) => pred(c)).map(([, i]) => i);
  return idxs.length ? pick(idxs) : null;
}

export function validateFilePath(path: string, allowedBase: string): boolean {
  const resolved = require("node:path").resolve(path);
  const base = require("node:path").resolve(allowedBase);
  return resolved.startsWith(base) && !path.includes("..");
}