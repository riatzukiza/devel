import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { config as loadDotenv } from "dotenv";

import type { KanbanConfigFile, KanbanProject, LoadedKanbanConfig } from "./types.js";

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

const projectIdFromPath = (tasksDir: string): string =>
  path
    .basename(tasksDir)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "kanban";

export const resolveConfiguredProjects = (
  loadedConfig: LoadedKanbanConfig,
  explicitTasksDir?: string
): { projects: KanbanProject[]; defaultProjectId: string } => {
  const explicitResolvedTasksDir = explicitTasksDir ? path.resolve(process.cwd(), explicitTasksDir) : undefined;

  if (loadedConfig.config.projects && loadedConfig.config.projects.length > 0) {
    const seen = new Set<string>();
    const projects = loadedConfig.config.projects.map((project, index) => {
      const tasksDir = resolveConfigPathValue(project.tasksDir, loadedConfig.configDir);
      if (!tasksDir) {
        throw new Error(`Project at index ${index} is missing tasksDir.`);
      }

      const baseId = project.id?.trim() || projectIdFromPath(tasksDir) || `project-${index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (seen.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      seen.add(id);

      return {
        id,
        title: project.title?.trim() || id,
        tasksDir
      } satisfies KanbanProject;
    });

    const defaultProjectId =
      loadedConfig.config.defaultProject && projects.some((project) => project.id === loadedConfig.config.defaultProject)
        ? loadedConfig.config.defaultProject
        : projects[0]?.id;

    if (!defaultProjectId) {
      throw new Error("No kanban projects configured.");
    }

    return { projects, defaultProjectId };
  }

  const tasksDir =
    explicitResolvedTasksDir ??
    resolveConfigPathValue(loadedConfig.config.tasksDir, loadedConfig.configDir) ??
    path.resolve(process.cwd(), "docs/agile/tasks");

  const id = projectIdFromPath(tasksDir);
  return {
    projects: [
      {
        id,
        title: id,
        tasksDir
      }
    ],
    defaultProjectId: id
  };
};
