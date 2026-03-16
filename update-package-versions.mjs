#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// NPM version mapping (pre-compiled from earlier npm view calls)
const NPM_VERSIONS = {
  '@promethean-os/ai-learning': '1.0.0',
  '@promethean-os/autocommit': '0.1.0',
  '@promethean-os/broker': '0.0.1',
  '@promethean-os/cephalon': '0.0.1',
  '@promethean-os/docs-system': '0.1.0',
  '@promethean-os/ds': '0.0.1',
  '@promethean-os/eidolon-field': '0.0.1',
  '@promethean-os/ecosystem-dsl': '1.0.0',
  '@promethean-os/enso-agent-communication': '1.0.0',
  '@promethean-os/enso-protocol': '1.0.0',
  '@promethean-os/fs': '0.0.1',
  '@promethean-os/github-sync': '0.1.0',
  '@promethean-os/kanban': '0.2.0',
  '@promethean-os/legacy': '0.2.0',
  '@promethean-os/level-cache': '0.2.0',
  '@promethean-os/lmdb-cache': '0.1.0',
  '@promethean-os/logger': '0.2.0',
  '@promethean-os/markdown': '0.0.1',
  '@promethean-os/mcp-dev-ui-frontend': '1.0.0',
  '@promethean-os/mcp-kanban-bridge': '1.0.0',
  '@promethean-os/ollama-queue': '1.0.0',
  '@promethean-os/opencode-client': '1.0.2',
  '@promethean-os/opencode-unified': '1.0.0',
  '@promethean-os/pantheon': '1.0.0',
  '@promethean-os/pantheon-core': '1.0.0',
  '@promethean-os/pantheon-llm-claude': '1.0.0',
  '@promethean-os/pantheon-llm-openai': '1.0.0',
  '@promethean-os/pantheon-llm-opencode': '1.0.0',
  '@promethean-os/pantheon-mcp': '0.0.1',
  '@promethean-os/pantheon-persistence': '1.0.0',
  '@promethean-os/persistence': '0.1.0',
  '@promethean-os/pipeline-automation': '1.0.0',
  '@promethean-os/piper': '0.1.0',
  '@promethean-os/plugin-hooks': '1.0.0',
  '@promethean-os/report-forge': '0.0.1',
  '@promethean-os/scar': '1.0.0',
  '@promethean-os/test-utils': undefined, // NOT FOUND on NPM
  '@promethean-os/tools': '0.0.0',
  '@promethean-os/trello': '0.1.0',
  '@promethean-os/utils': '0.0.1',
  '@promethean-os/voice-service': '0.0.1'
};

// Packages not on NPM (keep as workspace:*)
const INTERNAL_ONLY = new Set([
  '@promethean-os/apply-patch',
  '@promethean-os/auth-service',
  '@promethean-os/benchmark',
  '@promethean-os/boardrev',
  '@promethean-os/buildfix',
  '@promethean-os/cephalon-cljs',
  '@promethean-os/cephalon-ts',
  '@promethean-os/codemods',
  '@promethean-os/codepack',
  '@promethean-os/compiler',
  '@promethean-os/compliance-monitor',
  '@promethean-os/cookbookflow',
  '@promethean-os/discord',
  '@promethean-os/docops',
  '@promethean-os/docs-cli',
  '@promethean-os/duck-audio',
  '@promethean-os/effects',
  '@promethean-os/embedding',
  '@promethean-os/embedding-cache',
  '@promethean-os/enso-browser-gateway',
  '@promethean-os/event',
  '@promethean-os/file-indexer',
  '@promethean-os/file-indexer-service',
  '@promethean-os/frontend',
  '@promethean-os/frontend-service',
  '@promethean-os/fsm',
  '@promethean-os/http',
  '@promethean-os/kanban-plugin-content',
  '@promethean-os/kanban-plugin-git-index',
  '@promethean-os/kanban-plugin-heal',
  '@promethean-os/kanban-sdk',
  '@promethean-os/kanban-transition-rules',
  '@promethean-os/knowledge-graph',
  '@promethean-os/knowledge-graph-domain',
  '@promethean-os/knowledge-graph-simulation',
  '@promethean-os/knowledge-graph-storage',
  '@promethean-os/knowledge-graph-ui',
  '@promethean-os/lint-taskgen',
  '@promethean-os/lisp-fixer',
  '@promethean-os/llm',
  '@promethean-os/math-utils',
  '@promethean-os/mcp',
  '@promethean-os/mcp-express-server',
  '@promethean-os/messaging',
  '@promethean-os/migrations',
  '@promethean-os/omni-tools',
  '@promethean-os/openai-server',
  '@promethean-os/opencode-hub',
  '@promethean-os/opencode-interface-plugin',
  '@promethean-os/pantheon-coordination',
  '@promethean-os/pantheon-ecs',
  '@promethean-os/pantheon-generator',
  '@promethean-os/pantheon-orchestrator',
  '@promethean-os/pantheon-protocol',
  '@promethean-os/pantheon-state',
  '@promethean-os/pantheon-ui',
  '@promethean-os/pantheon-workflow',
  '@promethean-os/pipeline-core',
  '@promethean-os/platform',
  '@promethean-os/pm2-helpers',
  '@promethean-os/providers',
  '@promethean-os/readmeflow',
  '@promethean-os/security',
  '@promethean-os/semverguard',
  '@promethean-os/sentinel',
  '@promethean-os/simtasks',
  '@promethean-os/sonarflow',
  '@promethean-os/symdocs',
  '@promethean-os/testgap'
]);

function updatePackageJson(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    let updated = false;

    // Update dependencies
    if (pkg.dependencies) {
      for (const [dep, version] of Object.entries(pkg.dependencies)) {
        if (dep.startsWith('@promethean-os/')) {
          if (version === 'workspace:*' || version === 'workspace:^0.0.0' || version === '*') {
            if (NPM_VERSIONS[dep] && !INTERNAL_ONLY.has(dep)) {
              pkg.dependencies[dep] = NPM_VERSIONS[dep];
              console.log(`  Updated ${dep} to ${NPM_VERSIONS[dep]} in ${filePath}`);
              updated = true;
            }
          }
        }
      }
    }

    // Update devDependencies
    if (pkg.devDependencies) {
      for (const [dep, version] of Object.entries(pkg.devDependencies)) {
        if (dep.startsWith('@promethean-os/')) {
          if (version === 'workspace:*' || version === 'workspace:^0.0.0' || version === '*') {
            if (NPM_VERSIONS[dep] && !INTERNAL_ONLY.has(dep)) {
              pkg.devDependencies[dep] = NPM_VERSIONS[dep];
              console.log(`  Updated ${dep} to ${NPM_VERSIONS[dep]} in ${filePath}`);
              updated = true;
            }
          }
        }
      }
    }

    if (updated) {
      writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`  Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all package.json files with @promethean-os dependencies
console.log('Finding package.json files with @promethean-os dependencies...');
const output = execSync('grep -rl \'@promethean-os/\' /home/err/devel --include=package.json', { encoding: 'utf8' });
const files = output.trim().split('\n').filter(f => f);

console.log(`Found ${files.length} package.json files with @promethean-os dependencies\n`);

let updatedCount = 0;
for (const file of files) {
  if (updatePackageJson(file)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} package.json files`);
console.log(`📦 Kept ${files.length - updatedCount} files unchanged (no workspace:* dependencies found)`);
