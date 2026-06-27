import path from "node:path";

export function paths(dataDir: string) {
  const blobsDir = path.join(dataDir, "blobs", "sha256");
  const jobsPath = path.join(dataDir, "jobs", "jobs.jsonl");
  const cacheDir = path.join(dataDir, "cache");
  return { blobsDir, jobsPath, cacheDir };
}

export function blobPath(blobsDir: string, sha256: string): string {
  const a = sha256.slice(0, 2);
  const b = sha256.slice(2, 4);
  return path.join(blobsDir, a, b, sha256);
}
