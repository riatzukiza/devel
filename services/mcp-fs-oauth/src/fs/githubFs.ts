import type { FsBackend, FsEntry, FsStat } from "./types.js";

type GitHubContentFile = {
  type: "file";
  name: string;
  path: string;
  sha: string;
  size: number;
  encoding?: string;
  content?: string;
};

type GitHubContentDirEntry = {
  type: "dir" | "file";
  name: string;
  path: string;
  sha: string;
  size: number;
};

type GitHubContentResponse = GitHubContentFile | GitHubContentDirEntry[];

/**
 * GitHub repo backend using the Contents API.
 * Requires a token with permission to read/write contents.
 */
export class GitHubRepoBackend implements FsBackend {
  public readonly name = "github" as const;

  private readonly apiBase = "https://api.github.com";
  private readonly prefix: string;

  constructor(
    private readonly owner: string,
    private readonly repo: string,
    private readonly branch: string,
    private readonly token: string,
    repoPrefix?: string
  ) {
    // Normalize prefix (optional subfolder)
    const p = (repoPrefix ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
    this.prefix = p ? p + "/" : "";
  }

  async available(): Promise<boolean> {
    return Boolean(this.owner && this.repo && this.branch && this.token);
  }

  private toRepoPath(userPath: string): string {
    const cleaned = (userPath ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
    const norm = cleaned.split("/").filter(Boolean).join("/");
    // Basic traversal guard (Contents API rejects some, but be explicit)
    if (norm.includes("..")) throw new Error("Path traversal not allowed");
    return this.prefix + norm;
  }

  private async gh<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub API ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  }

  private contentsUrl(repoPath: string) {
    const encPath = repoPath.split("/").map(encodeURIComponent).join("/");
    const ref = encodeURIComponent(this.branch);
    return `${this.apiBase}/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${encPath}?ref=${ref}`;
  }

  async list(dirPath: string): Promise<FsEntry[]> {
    const repoPath = this.toRepoPath(dirPath);
    const url = this.contentsUrl(repoPath || this.prefix.replace(/\/$/, ""));
    const data = await this.gh<GitHubContentResponse>(url);

    if (Array.isArray(data)) {
      return data.map((e) => ({
        name: e.name,
        path: this.stripPrefix(e.path),
        kind: e.type === "dir" ? "dir" : "file",
      }));
    }

    if (data.type === "file") {
      const parent = repoPath.split("/").slice(0, -1).join("/");
      return this.list(this.stripPrefix(parent));
    }

    return [];
  }

  async readFile(filePath: string): Promise<{ path: string; content: string; etag?: string }> {
    const repoPath = this.toRepoPath(filePath);
    const url = this.contentsUrl(repoPath);
    const data = await this.gh<GitHubContentResponse>(url);

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error("Not a file");
    }

    const contentB64 = data.content ?? "";
    const buf = Buffer.from(contentB64, data.encoding === "base64" ? "base64" : "utf8");
    return { path: this.stripPrefix(data.path), content: buf.toString("utf8"), etag: data.sha };
  }

  async writeFile(filePath: string, content: string, intent?: string): Promise<{ path: string; etag?: string }> {
    const repoPath = this.toRepoPath(filePath);
    const url = `${this.apiBase}/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${repoPath.split("/").map(encodeURIComponent).join("/")}`;

    const current = await this.gh<GitHubContentResponse>(this.contentsUrl(repoPath)).catch(() => null);
    const sha = (!Array.isArray(current) && current?.type === "file") ? current.sha : undefined;

    const baseBody = {
      message: intent || `mcp write ${filePath}`,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: this.branch,
    };
    const body = sha ? { ...baseBody, sha } : baseBody;

    const out = await this.gh<{ content?: { sha: string }; commit?: { sha: string } }>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const newSha = out?.content?.sha ?? out?.commit?.sha;
    return { path: this.stripPrefix(repoPath), etag: newSha };
  }

  async deletePath(targetPath: string, intent?: string): Promise<{ path: string }> {
    const repoPath = this.toRepoPath(targetPath);
    const url = `${this.apiBase}/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${repoPath.split("/").map(encodeURIComponent).join("/")}`;

    const current = await this.gh<GitHubContentResponse>(this.contentsUrl(repoPath));
    if (Array.isArray(current) || current.type !== "file") {
      throw new Error("GitHub delete supports files only via Contents API");
    }
    const sha = current.sha;

    await this.gh<unknown>(url, {
      method: "DELETE",
      body: JSON.stringify({
        message: intent || `mcp delete ${targetPath}`,
        sha,
        branch: this.branch,
      }),
    });

    return { path: this.stripPrefix(repoPath) };
  }

  async stat(targetPath: string): Promise<FsStat> {
    const repoPath = this.toRepoPath(targetPath);
    const url = this.contentsUrl(repoPath || this.prefix.replace(/\/$/, ""));
    const data = await this.gh<GitHubContentResponse>(url);

    if (Array.isArray(data)) {
      return { path: this.stripPrefix(repoPath), kind: "dir" };
    }

    return {
      path: this.stripPrefix(data.path),
      kind: data.type === "file" ? "file" : "dir",
      size: data.size,
      etag: data.sha,
    };
  }

  private stripPrefix(repoPath: string): string {
    if (this.prefix && repoPath.startsWith(this.prefix)) {
      return repoPath.slice(this.prefix.length);
    }
    return repoPath;
  }
}
