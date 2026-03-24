type FetchLike = typeof fetch;

export type GitHubIssueClientEnv = {
  token?: string;
  owner?: string;
  repo?: string;
};

export type GitHubLabelDefinition = {
  name: string;
  color: string;
  description?: string;
};

export type GitHubRepositoryLabel = {
  name: string;
  color?: string;
  description?: string | null;
};

const required = (value: string | undefined, name: string): string => {
  if (!value || !value.trim()) {
    throw new Error(`Missing ${name}`);
  }

  return value;
};

export const makeGitHubIssueClient = (env: GitHubIssueClientEnv, f: FetchLike = fetch) => {
  const base = "https://api.github.com";
  const token = env.token;
  const owner = env.owner;
  const repo = env.repo;

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };

  const url = (value: string): string => `${base}${value}`;

  const readJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${response.status}: ${body || response.statusText}`);
    }

    return (await response.json()) as T;
  };

  const listRepositoryLabels = async (): Promise<GitHubRepositoryLabel[]> => {
    required(owner, "owner");
    required(repo, "repo");

    const labels: GitHubRepositoryLabel[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const response = await f(url(`/repos/${owner}/${repo}/labels?per_page=100&page=${page}`), {
        method: "GET",
        headers
      });
      const batch = await readJson<GitHubRepositoryLabel[]>(response);
      labels.push(...batch);
      if (batch.length < 100) {
        break;
      }
    }

    return labels;
  };

  const createLabel = async (definition: GitHubLabelDefinition) => {
    if (!token) {
      return { skipped: true as const, reason: "no-token" };
    }

    required(owner, "owner");
    required(repo, "repo");

    const response = await f(url(`/repos/${owner}/${repo}/labels`), {
      method: "POST",
      headers,
      body: JSON.stringify(definition)
    });

    return { ok: response.ok, status: response.status };
  };

  const getIssueLabels = async (issueNumber: number): Promise<string[]> => {
    required(owner, "owner");
    required(repo, "repo");

    const response = await f(url(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`), {
      method: "GET",
      headers
    });

    const labels = await readJson<Array<{ name?: string }>>(response);
    return labels.map((label) => label.name ?? "").filter(Boolean);
  };

  const replaceLabels = async (issueNumber: number, labels: string[]) => {
    if (!token) {
      return { skipped: true as const, reason: "no-token" };
    }

    required(owner, "owner");
    required(repo, "repo");

    const response = await f(url(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`), {
      method: "PUT",
      headers,
      body: JSON.stringify({ labels })
    });

    return { ok: response.ok, status: response.status };
  };

  const applyLabels = async (issueNumber: number, labels: string[]) => {
    if (!token) {
      return { skipped: true as const, reason: "no-token" };
    }

    required(owner, "owner");
    required(repo, "repo");

    const response = await f(url(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`), {
      method: "POST",
      headers,
      body: JSON.stringify({ labels })
    });

    return { ok: response.ok, status: response.status };
  };

  const comment = async (issueNumber: number, body: string) => {
    if (!token) {
      return { skipped: true as const, reason: "no-token" };
    }

    required(owner, "owner");
    required(repo, "repo");

    const response = await f(url(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`), {
      method: "POST",
      headers,
      body: JSON.stringify({ body })
    });

    return { ok: response.ok, status: response.status };
  };

  return {
    listRepositoryLabels,
    createLabel,
    getIssueLabels,
    replaceLabels,
    applyLabels,
    comment
  } as const;
};
