import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AutoForkTaxState } from "./types";

const defaultState = (): AutoForkTaxState => ({ version: 1 });

export const statePathFor = (root: string): string => path.join(root, ".ημ", "auto-fork-tax", "state.json");

export const readState = async (root: string): Promise<AutoForkTaxState> => {
  const statePath = statePathFor(root);
  try {
    const raw = await readFile(statePath, "utf8");
    return {
      ...defaultState(),
      ...(JSON.parse(raw) as AutoForkTaxState),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultState();
    }
    throw error;
  }
};

export const writeState = async (root: string, state: AutoForkTaxState): Promise<void> => {
  const statePath = statePathFor(root);
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
};
