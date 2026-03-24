const createCacheStore = () => new Map();

const latestCheckRunsByName = (runs) => {
  const byName = new Map();

  for (const run of runs) {
    const stamp = Date.parse(run.completed_at || run.started_at || run.created_at || 0);
    const current = byName.get(run.name);
    if (!current || stamp >= current._stamp) {
      byName.set(run.name, {
        ...run,
        _stamp: stamp,
      });
    }
  }

  return Object.fromEntries([...byName.entries()].map(([name, run]) => [name, run]));
};

export const checkState = (run) => {
  if (!run) return 'missing';
  return run.conclusion || run.status || 'pending';
};

export const createGitHubClient = ({ token = '', ttlMs = 60_000 } = {}) => {
  const cache = createCacheStore();

  const clear = () => {
    cache.clear();
  };

  const headers = () => {
    const value = {
      accept: 'application/vnd.github+json',
      'user-agent': 'eta-mu-control-plane',
    };

    if (token) {
      value.authorization = `Bearer ${token}`;
    }

    return value;
  };

  const json = async (apiPath) => {
    const now = Date.now();
    const cached = cache.get(apiPath);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const response = await fetch(`https://api.github.com${apiPath}`, {
      headers: headers(),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${apiPath} -> ${response.status} ${body.slice(0, 240)}`);
    }

    const value = await response.json();
    cache.set(apiPath, {
      value,
      expiresAt: now + ttlMs,
    });
    return value;
  };

  const mutateJson = async (method, apiPath, body) => {
    const response = await fetch(`https://api.github.com${apiPath}`, {
      method,
      headers: {
        ...headers(),
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`GitHub API ${method} ${apiPath} -> ${response.status} ${text.slice(0, 240)}`);
      error.statusCode = response.status;
      throw error;
    }

    clear();

    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    return JSON.parse(text);
  };

  const graphql = async (query, variables = {}) => {
    if (!token) {
      const error = new Error('GitHub GraphQL requires ETA_MU_GITHUB_TOKEN or GITHUB_TOKEN');
      error.code = 'GITHUB_AUTH_REQUIRED';
      throw error;
    }

    const key = `graphql:${query}:${JSON.stringify(variables)}`;
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        ...headers(),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub GraphQL -> ${response.status} ${body.slice(0, 240)}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(`GitHub GraphQL errors: ${payload.errors.map((item) => item.message).join('; ')}`);
    }

    cache.set(key, {
      value: payload.data,
      expiresAt: now + ttlMs,
    });

    return payload.data;
  };

  return {
    hasAuth: Boolean(token),
    clear,
    json,
    mutateJson,
    graphql,
    latestCheckRunsByName,
  };
};
