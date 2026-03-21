import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { config as loadDotenv } from "dotenv";

import type { KanbanConfigFile, LoadedKanbanConfig } from "./types.js";

const defaultConfigNames = ["openhax.kanban.json", "kanban.json"];

const canRead = async (candidate: string): Promise<boolean> => {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
};

export const loadEnvironment = (): void => {
  loadDotenv();
};

export const findConfigPath = async (explicitPath?: string): Promise<string | undefined> => {
  if (explicitPath) {
    return path.resolve(process.cwd(), explicitPath);
  }

  for (const configName of defaultConfigNames) {
    const candidate = path.resolve(process.cwd(), configName);
    if (await canRead(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

export const loadConfig = async (explicitPath?: string): Promise<LoadedKanbanConfig> => {
  const configPath = await findConfigPath(explicitPath);
  if (!configPath) {
    return {
      config: {},
      configDir: process.cwd()
    };
  }

  const rawConfig = await readFile(configPath, "utf8");
  const parsedConfig = JSON.parse(rawConfig) as KanbanConfigFile;

  return {
    config: parsedConfig,
    configPath,
    configDir: path.dirname(configPath)
  };
};

export const resolveConfigPathValue = (value: string | undefined, configDir: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  return path.isAbsolute(value) ? value : path.resolve(configDir, value);
};
