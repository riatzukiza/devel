import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ETA_MU_FIVE_SECTION_CONTRACT_EDN,
  INVALID_FIVE_SECTION_RESPONSE,
  VALID_FIVE_SECTION_RESPONSE,
} from './fixtures.js';
import { runCli } from './cli.js';

const withTempDir = async (callback: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), 'output-contract-gate-'));
  try {
    await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

test('runCli exits 0 and prints success JSON for a valid response', async () => {
  await withTempDir(async (dir) => {
    const contractPath = join(dir, 'contract.edn');
    const responsePath = join(dir, 'response.md');
    const artifactsRoot = join(dir, 'artifacts');
    await writeFile(contractPath, ETA_MU_FIVE_SECTION_CONTRACT_EDN, 'utf8');
    await writeFile(responsePath, VALID_FIVE_SECTION_RESPONSE, 'utf8');

    let stdout = '';
    let stderr = '';
    const exitCode = await runCli(
      ['--contract', contractPath, '--response', responsePath, '--artifacts-root', artifactsRoot],
      {
        stdout: (text) => {
          stdout += text;
        },
        stderr: (text) => {
          stderr += text;
        },
      },
    );

    assert.equal(exitCode, 0);
    assert.equal(stderr, '');
    const payload = JSON.parse(stdout) as {
      ok: boolean;
      failureCount: number;
      response: { sectionHeadings: string[] };
      artifacts: { dir: string; files: Record<string, string> };
    };
    assert.equal(payload.ok, true);
    assert.equal(payload.failureCount, 0);
    assert.deepEqual(payload.response.sectionHeadings, ['Signal', 'Evidence', 'Frames', 'Countermoves', 'Next']);
    assert.ok(payload.artifacts.dir.startsWith(artifactsRoot));
  });
});

test('runCli exits 1 and prints repair JSON for an invalid response', async () => {
  await withTempDir(async (dir) => {
    const contractPath = join(dir, 'contract.edn');
    const responsePath = join(dir, 'response.md');
    const artifactsRoot = join(dir, 'artifacts');
    await writeFile(contractPath, ETA_MU_FIVE_SECTION_CONTRACT_EDN, 'utf8');
    await writeFile(responsePath, INVALID_FIVE_SECTION_RESPONSE, 'utf8');

    let stdout = '';
    let stderr = '';
    const exitCode = await runCli(
      ['--contract', contractPath, '--response', responsePath, '--artifacts-root', artifactsRoot],
      {
        stdout: (text) => {
          stdout += text;
        },
        stderr: (text) => {
          stderr += text;
        },
      },
    );

    assert.equal(exitCode, 1);
    assert.equal(stderr, '');
    const payload = JSON.parse(stdout) as {
      ok: boolean;
      failureCount: number;
      repairPrompt: string;
      report: { failures: Array<{ ruleId: string }> };
      artifacts: { dir: string; files: Record<string, string> };
    };
    assert.equal(payload.ok, false);
    assert.ok(payload.failureCount >= 1);
    assert.match(payload.repairPrompt, /Repair only the following violations/i);
    assert.ok(payload.report.failures.some((failure) => failure.ruleId === 'rule/section-order'));
    const bundleFiles = await readdir(payload.artifacts.dir);
    assert.ok(bundleFiles.includes('contract.edn'));
    assert.ok(bundleFiles.includes('candidate.ast.json'));
    assert.ok(bundleFiles.includes('validation-report.json'));
    assert.ok(bundleFiles.includes('final-decision.json'));
    assert.ok(bundleFiles.includes('repair-prompt.txt'));

    const finalDecision = JSON.parse(await readFile(payload.artifacts.files.finalDecision, 'utf8')) as {
      ok: boolean;
      exitCode: number;
      failureCount: number;
      hasRepairPrompt: boolean;
    };
    assert.equal(finalDecision.ok, false);
    assert.equal(finalDecision.exitCode, 1);
    assert.ok(finalDecision.failureCount >= 1);
    assert.equal(finalDecision.hasRepairPrompt, true);
  });
});

test('runCli review-stub emits review-report.json for a structurally valid bundle', async () => {
  await withTempDir(async (dir) => {
    const contractPath = join(dir, 'contract.edn');
    const responsePath = join(dir, 'response.md');
    const artifactsRoot = join(dir, 'artifacts');
    await writeFile(contractPath, ETA_MU_FIVE_SECTION_CONTRACT_EDN, 'utf8');
    await writeFile(responsePath, VALID_FIVE_SECTION_RESPONSE, 'utf8');

    let validateStdout = '';
    const validateExitCode = await runCli(
      ['--contract', contractPath, '--response', responsePath, '--artifacts-root', artifactsRoot],
      {
        stdout: (text) => {
          validateStdout += text;
        },
        stderr: () => {},
      },
    );

    assert.equal(validateExitCode, 0);
    const validatePayload = JSON.parse(validateStdout) as {
      artifacts: { dir: string; files: Record<string, string> };
    };

    let reviewStdout = '';
    let reviewStderr = '';
    const reviewExitCode = await runCli(
      ['review-stub', '--bundle', validatePayload.artifacts.dir],
      {
        stdout: (text) => {
          reviewStdout += text;
        },
        stderr: (text) => {
          reviewStderr += text;
        },
      },
    );

    assert.equal(reviewStderr, '');
    assert.equal(reviewExitCode, 0);
    const reviewPayload = JSON.parse(reviewStdout) as {
      ok: boolean;
      reviewReport: { stage: string; reviewer: string; overallScore: number; criteria: Array<{ id: string }> };
      written: { reviewReportPath: string; finalDecisionPath: string };
    };
    assert.equal(reviewPayload.ok, true);
    assert.equal(reviewPayload.reviewReport.stage, 'review');
    assert.equal(reviewPayload.reviewReport.reviewer, 'stub');
    assert.ok(reviewPayload.reviewReport.criteria.some((criterion) => criterion.id === 'criterion/contract-fidelity'));

    const reviewReport = JSON.parse(await readFile(reviewPayload.written.reviewReportPath, 'utf8')) as {
      stage: string;
      reviewer: string;
      limitations: string[];
    };
    assert.equal(reviewReport.stage, 'review');
    assert.equal(reviewReport.reviewer, 'stub');
    assert.ok(reviewReport.limitations.length >= 1);

    const finalDecision = JSON.parse(await readFile(reviewPayload.written.finalDecisionPath, 'utf8')) as {
      review: { reviewer: string; ok: boolean; overallScore: number };
    };
    assert.equal(finalDecision.review.reviewer, 'stub');
    assert.equal(finalDecision.review.ok, true);
    assert.ok(finalDecision.review.overallScore > 0);
  });
});

test('runCli generate writes generation artifacts and auto-runs review stub on success', async () => {
  await withTempDir(async (dir) => {
    const contractPath = join(dir, 'contract.edn');
    const artifactsRoot = join(dir, 'artifacts');
    await writeFile(contractPath, ETA_MU_FIVE_SECTION_CONTRACT_EDN, 'utf8');

    let stdout = '';
    let stderr = '';
    const exitCode = await runCli(
      [
        'generate',
        '--contract', contractPath,
        '--task-text', 'Turn this task into the required five-section response.',
        '--generator', 'fixture-valid',
        '--artifacts-root', artifactsRoot,
      ],
      {
        stdout: (text) => {
          stdout += text;
        },
        stderr: (text) => {
          stderr += text;
        },
      },
    );

    assert.equal(stderr, '');
    assert.equal(exitCode, 0);
    const payload = JSON.parse(stdout) as {
      ok: boolean;
      generation: { stage: string; generator: string };
      structure: { ok: boolean };
      review: { stage: string; reviewer: string };
      artifacts: { dir: string; files: Record<string, string> };
      generationArtifacts: { taskPath: string; generationReportPath: string };
      reviewArtifacts: { reviewReportPath: string; finalDecisionPath: string };
    };

    assert.equal(payload.ok, true);
    assert.equal(payload.generation.stage, 'generate');
    assert.equal(payload.generation.generator, 'fixture-valid');
    assert.equal(payload.structure.ok, true);
    assert.equal(payload.review.stage, 'review');
    assert.equal(payload.review.reviewer, 'stub');

    const bundleFiles = await readdir(payload.artifacts.dir);
    assert.ok(bundleFiles.includes('task.txt'));
    assert.ok(bundleFiles.includes('generation-report.json'));
    assert.ok(bundleFiles.includes('review-report.json'));

    const taskText = await readFile(payload.generationArtifacts.taskPath, 'utf8');
    assert.match(taskText, /required five-section response/i);

    const generationReport = JSON.parse(await readFile(payload.generationArtifacts.generationReportPath, 'utf8')) as {
      stage: string;
      generator: string;
    };
    assert.equal(generationReport.stage, 'generate');
    assert.equal(generationReport.generator, 'fixture-valid');

    const finalDecision = JSON.parse(await readFile(payload.reviewArtifacts.finalDecisionPath, 'utf8')) as {
      review: { reviewer: string; ok: boolean };
    };
    assert.equal(finalDecision.review.reviewer, 'stub');
    assert.equal(finalDecision.review.ok, true);
  });
});

test('runCli generate repairs malformed output within bounded retries', async () => {
  await withTempDir(async (dir) => {
    const contractPath = join(dir, 'contract.edn');
    const artifactsRoot = join(dir, 'artifacts');
    await writeFile(contractPath, ETA_MU_FIVE_SECTION_CONTRACT_EDN, 'utf8');

    let stdout = '';
    let stderr = '';
    const exitCode = await runCli(
      [
        'generate',
        '--contract', contractPath,
        '--task-text', 'Repair this into the correct five-section response.',
        '--generator', 'fixture-invalid',
        '--artifacts-root', artifactsRoot,
      ],
      {
        stdout: (text) => {
          stdout += text;
        },
        stderr: (text) => {
          stderr += text;
        },
      },
    );

    assert.equal(stderr, '');
    assert.equal(exitCode, 0);
    const payload = JSON.parse(stdout) as {
      ok: boolean;
      generation: { attempt: number; repairPromptApplied: boolean };
      structure: { ok: boolean };
      repairAttempts: Array<{ attempt: number; report: { failures: Array<{ ruleId: string }> } }>;
      repairAttemptArtifacts: Array<{ attempt: number; candidatePath: string; reportPath: string; repairPromptPath: string }>;
      review: { reviewer: string; ok: boolean };
    };

    assert.equal(payload.ok, true);
    assert.equal(payload.structure.ok, true);
    assert.equal(payload.generation.attempt, 1);
    assert.equal(payload.generation.repairPromptApplied, true);
    assert.equal(payload.repairAttempts.length, 1);
    assert.ok(payload.repairAttempts[0].report.failures.some((failure) => failure.ruleId === 'rule/section-order'));
    assert.equal(payload.review.reviewer, 'stub');
    assert.equal(payload.review.ok, true);
    assert.equal(payload.repairAttemptArtifacts.length, 1);

    const repairPromptText = await readFile(payload.repairAttemptArtifacts[0].repairPromptPath, 'utf8');
    assert.match(repairPromptText, /Repair only the following violations/i);
  });
});
