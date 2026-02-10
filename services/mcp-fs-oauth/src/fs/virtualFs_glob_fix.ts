// Fix for the glob method in virtualFs.ts
// This is the corrected glob method that properly handles searchPath

export const globFix = `
  async glob(pattern: string, options: GlobOptions = {}, backend?: FsBackendName): Promise<GlobResult> {
    const b = await this.pick(backend);
    const {
      path: searchPath = "",
      maxResults = 200,
      includeHidden = false,
      includeDirectories = true,
    } = options;

    const matches: GlobMatch[] = [];
    let truncated = false;

    const searchDir = async (dirPath: string): Promise<void> => {
      if (matches.length >= maxResults) {
        truncated = true;
        return;
      }

      const entries = await b.list(dirPath);
      for (const entry of entries) {
        if (matches.length >= maxResults) {
          truncated = true;
          return;
        }

        if (!includeHidden && entry.name.startsWith(".")) {
          continue;
        }

        const entryPath = dirPath ? \`\${dirPath}/\${entry.name}\` : entry.name;

        // FIX: Calculate path relative to searchPath for pattern matching
        // When searchPath is provided, match pattern against relative path, not full path
        let patternCandidate = entryPath;
        if (searchPath && entryPath.startsWith(searchPath)) {
          // Remove searchPath prefix and any leading slash
          patternCandidate = entryPath.slice(searchPath.length).replace(/^\\//, "");
        }

        if (this.matchesGlobPattern(patternCandidate, pattern) && (entry.kind === "file" || includeDirectories)) {
          matches.push({
            path: entryPath,  // Keep full path in result
            kind: entry.kind,
          });
        }

        if (entry.kind === "dir") {
          await searchDir(entryPath);
        }
      }
    };

    await searchDir(searchPath);

    return {
      path: searchPath,
      pattern,
      maxResults,
      truncated,
      matches,
    };
  }
`;
