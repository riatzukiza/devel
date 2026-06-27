import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { ArtifactBundle, ExtractedDocument, FailureReport, GenerationReport, NormalizedContract, RepairAttemptRecord, ReviewReport } from './types.js';

type ArtifactInput = {
  readonly artifactsRoot: string;
  readonly contractPath: string;
  readonly responsePath: string;
  readonly contractSource: string;
  readonly responseMarkdown: string;
  readonly contract: NormalizedContract;
  readonly document: ExtractedDocument;
  readonly report: FailureReport;
  readonly repairPrompt?: string;
  readonly exitCode: number;
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

const runIdNow = (): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${stamp}_${randomUUID().slice(0, 8)}`;
};

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

export const writeRunArtifacts = async ({
  artifactsRoot,
  contractPath,
  responsePath,
  contractSource,
  responseMarkdown,
  contract,
  document,
  report,
  repairPrompt,
  exitCode,
}: ArtifactInput): Promise<ArtifactBundle> => {
  const root = resolve(artifactsRoot);
  const runId = runIdNow();
  const dir = join(root, runId);
  await mkdir(dir, { recursive: true });

  const repairPromptFile = repairPrompt ? join(dir, 'repair-prompt.txt') : undefined;

  const files = {
    input: join(dir, 'input.json'),
    contract: join(dir, 'contract.edn'),
    contractIr: join(dir, 'contract-ir.json'),
    candidate: join(dir, 'candidate.md'),
    candidateAst: join(dir, 'candidate.ast.json'),
    validationReport: join(dir, 'validation-report.json'),
    finalDecision: join(dir, 'final-decision.json'),
    ...(repairPromptFile ? { repairPrompt: repairPromptFile } : {}),
  };

  const contractHash = sha256(contractSource);
  const candidateHash = sha256(responseMarkdown);
  const astHash = sha256(JSON.stringify(document.ast));

  await Promise.all([
    writeJson(files.input, {
      createdAt: new Date().toISOString(),
      contractPath,
      responsePath,
      artifactsRoot: root,
    }),
    writeFile(files.contract, contractSource, 'utf8'),
    writeJson(files.contractIr, contract),
    writeFile(files.candidate, responseMarkdown, 'utf8'),
    writeJson(files.candidateAst, document.ast),
    writeJson(files.validationReport, report),
    writeJson(files.finalDecision, {
      ok: report.ok,
      stage: report.stage,
      exitCode,
      contract: {
        name: contract.name,
        version: contract.version,
      },
      hashes: {
        contract: contractHash,
        candidate: candidateHash,
        candidateAst: astHash,
      },
      failureCount: report.failures.length,
      hasRepairPrompt: Boolean(repairPrompt),
    }),
    ...(repairPrompt && repairPromptFile ? [writeFile(repairPromptFile, `${repairPrompt}\n`, 'utf8')] : []),
  ]);

  return {
    root,
    runId,
    dir,
    files,
  };
};

export const writeReviewArtifacts = async (
  bundleDir: string,
  report: ReviewReport,
): Promise<{ readonly reviewReportPath: string; readonly finalDecisionPath: string }> => {
  const dir = resolve(bundleDir);
  const reviewReportPath = join(dir, 'review-report.json');
  const finalDecisionPath = join(dir, 'final-decision.json');

  await writeJson(reviewReportPath, report);

  let finalDecision: Record<string, unknown> = {
    ok: report.ok,
    stage: 'review',
  };

  try {
    const existing = JSON.parse(await readFile(finalDecisionPath, 'utf8')) as Record<string, unknown>;
    finalDecision = existing;
  } catch {
    // keep fallback object
  }

  await writeJson(finalDecisionPath, {
    ...finalDecision,
    review: {
      reviewer: report.reviewer,
      ok: report.ok,
      threshold: report.threshold,
      overallScore: report.overallScore,
      reportPath: reviewReportPath,
    },
  });

  return { reviewReportPath, finalDecisionPath };
};

export const writeGenerationArtifacts = async (
  bundleDir: string,
  taskText: string,
  report: GenerationReport,
  repairAttemptsCount = 0,
): Promise<{ readonly taskPath: string; readonly generationReportPath: string; readonly inputPath: string }> => {
  const dir = resolve(bundleDir);
  const taskPath = join(dir, 'task.txt');
  const generationReportPath = join(dir, 'generation-report.json');
  const inputPath = join(dir, 'input.json');

  await writeFile(taskPath, `${taskText}\n`, 'utf8');
  await writeJson(generationReportPath, report);

  let inputPayload: Record<string, unknown> = {};
  try {
    inputPayload = JSON.parse(await readFile(inputPath, 'utf8')) as Record<string, unknown>;
  } catch {
    inputPayload = {};
  }

  await writeJson(inputPath, {
    ...inputPayload,
    generation: {
      generator: report.generator,
      model: report.model,
      baseUrl: report.baseUrl,
      temperature: report.temperature,
      taskPath,
      generationReportPath,
      taskWordCount: report.promptSummary.taskWordCount,
      repairAttemptsCount,
    },
  });

  return { taskPath, generationReportPath, inputPath };
};

export const writeRepairAttemptArtifacts = async (
  bundleDir: string,
  attempts: readonly RepairAttemptRecord[],
): Promise<readonly { readonly attempt: number; readonly candidatePath: string; readonly reportPath: string; readonly repairPromptPath: string }[]> => {
  const dir = resolve(bundleDir);
  const outputs: Array<{ attempt: number; candidatePath: string; reportPath: string; repairPromptPath: string }> = [];

  for (const attempt of attempts) {
    const candidatePath = join(dir, `repair-attempt-${attempt.attempt}.md`);
    const reportPath = join(dir, `repair-attempt-${attempt.attempt}.validation-report.json`);
    const repairPromptPath = join(dir, `repair-attempt-${attempt.attempt}.repair-prompt.txt`);
    await Promise.all([
      writeFile(candidatePath, `${attempt.candidateMarkdown}\n`, 'utf8'),
      writeJson(reportPath, attempt.report),
      writeFile(repairPromptPath, `${attempt.repairPrompt}\n`, 'utf8'),
    ]);
    outputs.push({ attempt: attempt.attempt, candidatePath, reportPath, repairPromptPath });
  }

  return outputs;
};
