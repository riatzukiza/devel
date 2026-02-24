export type FsBackendName = "auto" | "local" | "github";

export type FsEntry = {
  name: string;
  path: string;
  kind: "file" | "dir";
};

export type FsStat = {
  path: string;
  kind: "file" | "dir";
  size?: number;
  etag?: string;
};

export interface FsBackend {
  name: Exclude<FsBackendName, "auto">;
  available(): Promise<boolean>;

  list(dirPath: string): Promise<FsEntry[]>;
  readFile(filePath: string): Promise<{ path: string; content: string; etag?: string }>;
  writeFile(filePath: string, content: string, intent?: string): Promise<{ path: string; etag?: string }>;
  deletePath(targetPath: string, intent?: string): Promise<{ path: string }>;
  stat(targetPath: string): Promise<FsStat>;
}
