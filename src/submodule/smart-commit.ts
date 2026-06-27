import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'bun';
import { discoverGitmodules, GitmoduleEntry } from '../nss/gitmodules';
import { generateCommitMessage, PantheonInput } from '../giga/pantheon';

interface SmartCommitOptions {
  message: string;
  dryRun?: boolean;
  recursive?: boolean;
}

interface CommitResult {
  path: string;
  hash: string;
  message: string;
  diff: string;
  parentResults?: CommitResult[];
}

class SmartCommiter {
  private readonly root: string;

  constructor(root: string = process.cwd()) {
    this.root = root;
  }

  async getChangeExplanation(message: string): Promise<string> {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(
        `\n🤔 Why were these changes made? (User message: "${message}")\n> `,
        (answer) => {
          rl.close();
          resolve(answer.trim());
        }
      );
    });
  }

  private async runCommand(cmd: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    console.log(`> ${cmd.join(' ')}`);
    const proc = spawn({ cmd, cwd, stdout: 'pipe', stderr: 'pipe' });
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: proc.exitCode || 0 };
  }

  private async hasChanges(repoPath: string): Promise<boolean> {
    const { stdout } = await this.runCommand(['git', 'status', '--porcelain'], repoPath);
    return stdout.trim().length > 0;
  }

  private async getStagedFiles(repoPath: string): Promise<string[]> {
    const { stdout } = await this.runCommand(['git', 'diff', '--staged', '--name-only'], repoPath);
    return stdout.trim() ? stdout.trim().split('\n') : [];
  }

  private async stageAllChanges(repoPath: string): Promise<void> {
    await this.runCommand(['git', 'add', '.'], repoPath);
  }

  private async commit(repoPath: string, message: string): Promise<string> {
    const { stdout } = await this.runCommand(['git', 'commit', '-m', message], repoPath);
    const hashMatch = stdout.match(/\[([a-f0-9]+)\]/);
    return hashMatch ? hashMatch[1] : '';
  }

  private async getCommitHash(repoPath: string, ref: string = 'HEAD'): Promise<string> {
    const { stdout } = await this.runCommand(['git', 'rev-parse', ref], repoPath);
    return stdout.trim();
  }

  private async getDiff(repoPath: string, from?: string, to?: string): Promise<string> {
    const args = ['diff', '--stat', '--no-color'];
    if (from && to) {
      args.push(`${from}..${to}`);
    } else {
      args.push('--staged');
    }
    const { stdout } = await this.runCommand(args, repoPath);
    return stdout;
  }

  private async generatePantheonMessage(
    repoPath: string, 
    action: string, 
    result: 'success' | 'failure',
    explanation: string,
    childResults?: CommitResult[]
  ): Promise<string> {
    // Build context from child results if available
    let context = '';
    if (childResults && childResults.length > 0) {
      context = '\n\nChild commits and changes:\n';
      for (const child of childResults) {
        context += `- ${child.path}: ${child.message}\n`;
        if (child.diff) {
          context += `  Changes: ${child.diff.split('\n')[0]}\n`;
        }
      }
    }

    const fullExplanation = explanation + context;

    // Create pantheon input that includes child context
    const pantheonInput: PantheonInput = {
      repoPath,
      action,
      result,
      affectedFiles: await this.getStagedFiles(repoPath),
    };

    // If PANTHEON_CLI is set, use it with enhanced context
    const pantheonCli = process.env.PANTHEON_CLI;
    if (pantheonCli) {
      try {
        const proc = spawn({
          cmd: pantheonCli.split(' '),
          cwd: repoPath,
          stdin: 'pipe',
          stdout: 'pipe',
          stderr: 'pipe',
          env: { ...process.env, PANTHEON_CONTEXT: fullExplanation },
        });
        
        const prompt = JSON.stringify({ 
          ...pantheonInput, 
          context: fullExplanation 
        });
        await proc.stdin?.write(prompt);
        proc.stdin?.end();
        
        const out = await new Response(proc.stdout).text();
        const err = await new Response(proc.stderr).text();
        
        if (proc.exitCode === 0 && out.trim()) {
          return out.trim();
        }
        console.warn("Pantheon CLI failed, falling back to enhanced message.", err);
      } catch (e) {
        console.warn("Pantheon CLI invocation error, falling back.", e);
      }
    }

    // Enhanced fallback message
    const diffStat = await this.getDiff(repoPath);
    return [
      `${action} ${result}`,
      '',
      `Explanation: ${explanation}`,
      childResults ? `Integrates changes from ${childResults.length} submodule(s)` : '',
      diffStat ? `\nChanges:\n${diffStat}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  async commitModule(entry: GitmoduleEntry, explanation: string, depth: number): Promise<CommitResult | null> {
    console.log(`${'  '.repeat(depth)}📁 Committing ${entry.path}`);

    if (!await this.hasChanges(entry.absolutePath)) {
      console.log(`${'  '.repeat(depth)}   No changes, skipping`);
      return null;
    }

    await this.stageAllChanges(entry.absolutePath);
    
    const message = await this.generatePantheonMessage(
      entry.absolutePath,
      'smart-commit',
      'success',
      explanation
    );

    const hash = await this.commit(entry.absolutePath, message);
    const diff = await this.getDiff(entry.absolutePath);
    
    const result: CommitResult = {
      path: entry.path,
      hash,
      message,
      diff
    };

    console.log(`${'  '.repeat(depth)}   ✅ Committed ${hash.substring(0, 7)}`);
    return result;
  }

  async commitParent(entry: GitmoduleEntry, childResults: CommitResult[], explanation: string, depth: number): Promise<CommitResult | null> {
    console.log(`${'  '.repeat(depth)}🔗 Committing parent ${entry.path}`);

    // Stage submodule pointer updates
    for (const child of childResults) {
      await this.runCommand(['git', 'add', child.path], entry.absolutePath);
    }

    if (!await this.hasChanges(entry.absolutePath)) {
      console.log(`${'  '.repeat(depth)}   No submodule changes, skipping`);
      return null;
    }

    const message = await this.generatePantheonMessage(
      entry.absolutePath,
      'smart-commit-aggregate',
      'success',
      explanation,
      childResults
    );

    const hash = await this.commit(entry.absolutePath, message);
    const diff = await this.getDiff(entry.absolutePath);

    const result: CommitResult = {
      path: entry.path,
      hash,
      message,
      diff,
      parentResults: childResults
    };

    console.log(`${'  '.repeat(depth)}   ✅ Aggregated ${hash.substring(0, 7)}`);
    return result;
  }

  async smartCommit(options: SmartCommitOptions): Promise<void> {
    console.log('🧠 Smart Commit: Analyzing submodule hierarchy...');

    const explanation = await this.getChangeExplanation(options.message);
    const modules = await discoverGitmodules({ root: this.root });
    
    // Filter to orgs/** submodules only
    const orgModules = modules.filter(m => m.path.startsWith('orgs/'));
    
    if (orgModules.length === 0) {
      console.log('No orgs/** submodules found');
      return;
    }

    // Build hierarchy: group by depth for breadth-first traversal
    const byDepth = new Map<number, GitmoduleEntry[]>();
    for (const module of orgModules) {
      const depth = module.depth;
      if (!byDepth.has(depth)) byDepth.set(depth, []);
      byDepth.get(depth)!.push(module);
    }

    // Process from deepest to shallowest (bottom-up)
    const depths = Array.from(byDepth.keys()).sort((a, b) => b - a);
    let currentResults: CommitResult[] = [];

    for (const depth of depths) {
      const modulesAtDepth = byDepth.get(depth)!;
      console.log(`\n📍 Processing depth ${depth} (${modulesAtDepth.length} modules):`);
      
      const depthResults: CommitResult[] = [];

      for (const module of modulesAtDepth) {
        const result = await this.commitModule(module, explanation, depth);
        if (result) depthResults.push(result);
      }

      // If we have parent modules at shallower depth, process their aggregation
      if (depth > 0 && depthResults.length > 0) {
        const parentDepth = depth - 1;
        const parentModules = byDepth.get(parentDepth) || [];
        
        for (const parent of parentModules) {
          const children = depthResults.filter(child => 
            child.path.startsWith(parent.path + '/')
          );
          
          if (children.length > 0) {
            const result = await this.commitParent(parent, children, explanation, parentDepth);
            if (result) currentResults.push(result);
          }
        }
      } else {
        currentResults.push(...depthResults);
      }
    }

    // Finally, commit the root workspace if there are changes
    console.log(`\n🏠 Processing root workspace...`);
    if (currentResults.length > 0) {
      for (const result of currentResults) {
        await this.runCommand(['git', 'add', result.path], this.root);
      }

      if (await this.hasChanges(this.root)) {
        const message = await this.generatePantheonMessage(
          this.root,
          'smart-commit-root',
          'success',
          explanation,
          currentResults
        );

        await this.commit(this.root, message);
        console.log(`✅ Root workspace committed`);
      }
    }

    console.log('\n🎉 Smart commit completed!');
  }
}

export async function smartCommitCommand(message: string, options: SmartCommitOptions): Promise<void> {
  const committer = new SmartCommiter();
  await committer.smartCommit({ ...options, message });
}