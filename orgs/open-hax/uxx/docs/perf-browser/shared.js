export function makeTree(depth, breadth, filesPerFolder, prefix = 'root') {
  const items = [];

  for (let i = 0; i < breadth; i += 1) {
    const folderId = `${prefix}/folder-${depth}-${i}`;
    const children = [];

    for (let j = 0; j < filesPerFolder; j += 1) {
      children.push({
        id: `${folderId}/file-${j}.ts`,
        name: `file-${j}.ts`,
        type: 'file',
        size: 512 + j * 17,
        badge: j % 3 === 0 ? 'M' : undefined,
      });
    }

    if (depth > 1) {
      children.push(...makeTree(depth - 1, breadth, filesPerFolder, folderId));
    }

    items.push({
      id: folderId,
      name: `folder-${depth}-${i}`,
      type: 'folder',
      badge: `${children.length}`,
      children,
    });
  }

  return items;
}

export function collectFolderIds(items, acc = []) {
  for (const item of items) {
    if (item.type === 'folder') {
      acc.push(item.id);
      if (item.children) collectFolderIds(item.children, acc);
    }
  }
  return acc;
}

export function collectFileIds(items, acc = []) {
  for (const item of items) {
    if (item.type === 'file') {
      acc.push(item.id);
    } else if (item.children) {
      collectFileIds(item.children, acc);
    }
  }
  return acc;
}

export function cloneTree(items) {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneTree(item.children) : undefined,
  }));
}

export function summarizeCommits(commits, label, wallMs, iterations) {
  const totalActualDuration = commits.reduce((sum, commit) => sum + commit.actualDuration, 0);
  const totalBaseDuration = commits.reduce((sum, commit) => sum + commit.baseDuration, 0);

  return {
    label,
    iterations,
    commits: commits.length,
    wallMs,
    wallMsPerUpdate: wallMs / Math.max(1, iterations),
    totalActualDuration,
    avgActualDuration: totalActualDuration / Math.max(1, commits.length),
    totalBaseDuration,
    avgBaseDuration: totalBaseDuration / Math.max(1, commits.length),
  };
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}
