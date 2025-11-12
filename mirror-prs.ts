#!/usr/bin/env bun

/**
 * Mirror PRs from sst/opencode to riatzukiza/opencode
 *
 * This script:
 * 1. Syncs dev branches between both remotes
 * 2. Creates mirror PRs for any open PRs that don't exist yet
 */

const { execSync } = require("child_process");
const path = require("path");

const SST_OPENCODE_PATH = path.join(__dirname, "orgs", "sst", "opencode");

function exec(command, cwd = SST_OPENCODE_PATH) {
  console.log(`🔧 Executing: ${command}`);
  try {
    const result = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    });
    return result.trim();
  } catch (error) {
    console.error(`❌ Error executing ${command}:`, error.message);
    throw error;
  }
}

function execSilent(command, cwd = SST_OPENCODE_PATH) {
  try {
    return execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  } catch (error) {
    return null;
  }
}

function getOpenPRs() {
  console.log("📋 Getting open PRs from sst/opencode...");
  const prsJson = exec(
    "gh pr list --author riatzukiza --state open --json number,title,headRefName,body",
  );
  return JSON.parse(prsJson);
}

function getExistingPRs() {
  console.log("📋 Getting existing PRs from riatzukiza/opencode...");
  try {
    const prsJson = exec(
      "gh pr list --repo riatzukiza/opencode --state all --json number,title,headRefName",
    );
    return JSON.parse(prsJson);
  } catch (error) {
    console.log("⚠️  Could not fetch existing PRs from riatzukiza/opencode");
    return [];
  }
}

function syncDevBranches() {
  console.log("🔄 Syncing dev branches...");

  // Fetch latest from both remotes
  exec("git fetch origin");
  exec("git fetch riatzukiza");

  // Stash any local changes
  const stashResult = execSilent('git stash push -m "auto-stash before sync"');
  if (stashResult) {
    console.log("💾 Stashed local changes");
  }

  // Switch to riatzukiza/dev and reset to match origin/dev
  exec("git checkout riatzukiza/dev");
  exec("git reset --hard origin/dev");

  // Force push to riatzukiza remote
  exec("git push -f riatzukiza HEAD:dev");

  // Restore stashed changes if any
  if (stashResult) {
    exec("git stash pop");
    console.log("📤 Restored stashed changes");
  }

  console.log("✅ Dev branches synced");
}

function createMirrorPR(pr, existingPRs) {
  const existingPR = existingPRs.find(
    (existing) => existing.headRefName === pr.headRefName,
  );

  if (existingPR) {
    console.log(
      `⏭️  PR #${pr.number} (${pr.headRefName}) already exists as #${existingPR.number}`,
    );
    return null;
  }

  console.log(`🔨 Creating mirror PR for #${pr.number}: ${pr.title}`);

  const body = pr.body
    ? `${pr.body}\n\n---\n\n*Mirrored from sst/opencode PR #${pr.number}*`
    : `---\n\n*Mirrored from sst/opencode PR #${pr.number}*`;

  try {
    const result = exec(
      `gh pr create --repo riatzukiza/opencode --title "${pr.title}" --body "${body}" --base dev --head ${pr.headRefName}`,
    );
    console.log(`✅ Created PR: ${result}`);
    return result;
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(`⏭️  PR for ${pr.headRefName} already exists`);
      return null;
    }
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting PR mirroring process...\n");

  try {
    // Sync dev branches first
    syncDevBranches();
    console.log("");

    // Get PRs
    const openPRs = getOpenPRs();
    const existingPRs = getExistingPRs();

    console.log(`📊 Found ${openPRs.length} open PRs on sst/opencode`);
    console.log(
      `📊 Found ${existingPRs.length} existing PRs on riatzukiza/opencode\n`,
    );

    // Create mirror PRs
    let createdCount = 0;
    for (const pr of openPRs) {
      const result = createMirrorPR(pr, existingPRs);
      if (result) createdCount++;
    }

    console.log(`\n🎉 Successfully created ${createdCount} new mirror PRs`);
    console.log(
      "🔗 View all PRs: https://github.com/riatzukiza/opencode/pulls",
    );
  } catch (error) {
    console.error("❌ Error during mirroring process:", error.message);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
