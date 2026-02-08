import type { FsBackend, FsBackendName, FsEntry, FsStat } from "./types.js";

export class VirtualFs {
  constructor(
    private readonly mode: FsBackendName,
    private readonly local: FsBackend | null,
    private readonly github: FsBackend | null
  ) {}

  private async pick(backend?: FsBackendName): Promise<FsBackend> {
    const choice = backend ?? this.mode;

    const localAvail = this.local && (await this.local.available());
    const ghAvail = this.github && (await this.github.available());

    const want = (name: "local" | "github") => {
      const b = name === "local" ? this.local : this.github;
      if (!b) throw new Error(`${name} backend not configured`);
      return b;
    };

    if (choice === "local") return want("local");
    if (choice === "github") return want("github");

    // auto
    if (localAvail) return want("local");
    if (ghAvail) return want("github");
    throw new Error("No storage backend available");
  }

  async list(path: string, backend?: FsBackendName): Promise<FsEntry[]> {
    const b = await this.pick(backend);
    return b.list(path);
  }

  async readFile(path: string, backend?: FsBackendName): Promise<{ path: string; content: string; etag?: string }> {
    const choice = backend ?? this.mode;
    if (choice === "auto") {
      try {
        const b = await this.pick("local");
        return await b.readFile(path);
      } catch {
        const b = await this.pick("github");
        return await b.readFile(path);
      }
    }
    const b = await this.pick(choice);
    return b.readFile(path);
  }

  async writeFile(path: string, content: string, message?: string, backend?: FsBackendName): Promise<{ path: string; etag?: string }> {
    const choice = backend ?? this.mode;
    if (choice === "auto") {
      try {
        const b = await this.pick("local");
        return await b.writeFile(path, content, message);
      } catch {
        const b = await this.pick("github");
        return await b.writeFile(path, content, message);
      }
    }
    const b = await this.pick(choice);
    return b.writeFile(path, content, message);
  }

  async deletePath(path: string, message?: string, backend?: FsBackendName): Promise<{ path: string }> {
    const choice = backend ?? this.mode;
    if (choice === "auto") {
      try {
        const b = await this.pick("local");
        return await b.deletePath(path, message);
      } catch {
        const b = await this.pick("github");
        return await b.deletePath(path, message);
      }
    }
    const b = await this.pick(choice);
    return b.deletePath(path, message);
  }

  async stat(path: string, backend?: FsBackendName): Promise<FsStat> {
    const b = await this.pick(backend);
    return b.stat(path);
  }
}
