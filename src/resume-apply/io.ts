import fs from "node:fs/promises";
import path from "node:path";

export const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

export const writeText = async (filePath: string, content: string): Promise<void> => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
};

export const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
};

export const copyIfExists = async (sourcePath: string, destPath: string): Promise<boolean> => {
  if (!(await fileExists(sourcePath))) {
    return false;
  }
  await ensureDir(path.dirname(destPath));
  await fs.copyFile(sourcePath, destPath);
  return true;
};
