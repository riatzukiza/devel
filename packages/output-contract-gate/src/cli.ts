#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { writeGenerationArtifacts, writeRepairAttemptArtifacts, writeReviewArtifacts, writeRunArtifacts } from './artifacts.js';
import { compileAgentOutputContract } from './edn.js';
import { generateCandidate } from './generate.js';
import { extractMarkdownSections } from './markdown.js';
import { compileRepairPrompt } from './repair.js';
import { buildStubReviewReport, buildGptReviewReport } from './review.js';
import { toFailureReport, validateMarkdownResponse } from './validate.js';
import type { RepairAttemptRecord } from './types.js';

type ValidateCliArgs = {
  readonly mode: 'validate';
  readonly contractPath: string;
  readonly responsePath: string;
  readonly artifactsRoot?: string;
};

type GenerateCliArgs = {
  readonly mode: 'generate';
  readonly contractPath: string;
  readonly taskText?: string;
  readonly taskPath?: string;
  readonly artifactsRoot?: string;
  readonly generator: 'fixture-valid' | 'fixture-invalid' | 'openai-chat';
  readonly baseUrl?: string;
  readonly model?: string;
  readonly apiKey?: string;
  readonly temperature: number;
};

type ReviewStubCliArgs = {
  readonly mode: 'review-stub';
  readonly bundleDir: string;
};

type ReviewGptCliArgs = {
  readonly mode: 'review-gpt';
  readonly bundleDir: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly maxSessionTurns?: number;
  readonly temperature?: number;
  readonly noFallback?: boolean;
};

type CliArgs = ValidateCliArgs | GenerateCliArgs | ReviewStubCliArgs | ReviewGptCliArgs;

type CliIo = {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
};

const defaultIo: CliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

const usage = `Usage:
  output-contract-gate --contract <path/to/contract.edn> --response <path/to/response.md>
  output-contract-gate generate --contract <path/to/contract.edn> (--task-file <path> | --task-text <text>)
  output-contract-gate review-stub --bundle <path/to/bundle>
  output-contract-gate review-gpt --bundle <path/to/bundle>

Flags:
  --contract   Path to an EDN contract file
  --response   Path to a Markdown response file
  --task-file  Path to a task/prompt text file for generation mode
  --task-text  Inline task/prompt text for generation mode
  --generator  fixture-valid | fixture-invalid | openai-chat (default: fixture-valid)
  --bundle     Path to a previously written artifact bundle
  --artifacts-root  Optional root for run artifacts (default: ./artifacts/output-contract-gate)
  --base-url   OpenAI-compatible base URL for generate/review mode (default: OPENAI_BASE_URL or http://127.0.0.1:8789/v1)
  --model      Model id for generate/review mode (default: gpt-5.4)
  --api-key    Explicit API credential for generate/review mode
  --temperature Numeric temperature for generate/review mode (default: 0.2 for generate, 0.3 for review)
  --max-session-turns  Max session turns for review-gpt (default: 10)
  --no-fallback  For review-gpt: fail instead of falling back to stub on error
  --no-artifacts    Disable artifact writing for this run
  --help       Show this help
`;

export class CliUsageError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

const parseValidateArgs = (argv: readonly string[]): ValidateCliArgs => {
  let contractPath: string | undefined;
  let responsePath: string | undefined;
  let artifactsRoot: string | undefined = resolve(process.cwd(), 'artifacts', 'output-contract-gate');

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') {
      throw new CliUsageError(usage);
    }
    if (token === '--contract') {
      contractPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--response') {
      responsePath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--artifacts-root') {
      artifactsRoot = resolve(argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (token === '--no-artifacts') {
      artifactsRoot = undefined;
      continue;
    }
    throw new CliUsageError(`Unknown argument: ${token}`);
  }

  if (!contractPath || !responsePath) {
    throw new CliUsageError('Both --contract and --response are required.');
  }

  return {
    mode: 'validate',
    contractPath: resolve(contractPath),
    responsePath: resolve(responsePath),
    artifactsRoot,
  };
};

const parseGenerateArgs = (argv: readonly string[]): GenerateCliArgs => {
  let contractPath: string | undefined;
  let taskPath: string | undefined;
  let taskText: string | undefined;
  let artifactsRoot: string | undefined = resolve(process.cwd(), 'artifacts', 'output-contract-gate');
  let generator: GenerateCliArgs['generator'] = 'fixture-valid';
  let baseUrl: string | undefined;
  let model: string | undefined;
  let apiKey: string | undefined;
  let temperature = 0.2;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') {
      throw new CliUsageError(usage);
    }
    if (token === '--contract') {
      contractPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--task-file') {
      taskPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--task-text') {
      taskText = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--artifacts-root') {
      artifactsRoot = resolve(argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (token === '--no-artifacts') {
      artifactsRoot = undefined;
      continue;
    }
    if (token === '--generator') {
      const value = argv[index + 1];
      if (value !== 'fixture-valid' && value !== 'fixture-invalid' && value !== 'openai-chat') {
        throw new CliUsageError(`Unsupported generator: ${value}`);
      }
      generator = value;
      index += 1;
      continue;
    }
    if (token === '--base-url') {
      baseUrl = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--model') {
      model = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--api-key') {
      apiKey = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--temperature') {
      temperature = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new CliUsageError(`Unknown argument: ${token}`);
  }

  if (!contractPath) {
    throw new CliUsageError('generate requires --contract <path>.');
  }
  if (!taskPath && !taskText) {
    throw new CliUsageError('generate requires either --task-file <path> or --task-text <text>.');
  }
  if (taskPath && taskText) {
    throw new CliUsageError('generate accepts only one of --task-file or --task-text.');
  }
  if (!Number.isFinite(temperature)) {
    throw new CliUsageError('--temperature must be numeric.');
  }

  return {
    mode: 'generate',
    contractPath: resolve(contractPath),
    ...(taskPath ? { taskPath: resolve(taskPath) } : {}),
    ...(taskText ? { taskText } : {}),
    artifactsRoot,
    generator,
    ...(baseUrl ? { baseUrl } : {}),
    ...(model ? { model } : {}),
    ...(apiKey ? { apiKey } : {}),
    temperature,
  };
};

const parseReviewStubArgs = (argv: readonly string[]): ReviewStubCliArgs => {
  let bundleDir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') {
      throw new CliUsageError(usage);
    }
    if (token === '--bundle') {
      bundleDir = argv[index + 1];
      index += 1;
      continue;
    }
    throw new CliUsageError(`Unknown argument: ${token}`);
  }

  if (!bundleDir) {
    throw new CliUsageError('review-stub requires --bundle <path>.');
  }

  return {
    mode: 'review-stub',
    bundleDir: resolve(bundleDir),
  };
};

const parseReviewGptArgs = (argv: readonly string[]): ReviewGptCliArgs => {
  let bundleDir: string | undefined;
  let model: string | undefined;
  let baseUrl: string | undefined;
  let apiKey: string | undefined;
  let maxSessionTurns: number | undefined;
  let temperature: number | undefined;
  let noFallback = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') {
      throw new CliUsageError(usage);
    }
    if (token === '--bundle') {
      bundleDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--model') {
      model = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--base-url') {
      baseUrl = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--api-key') {
      apiKey = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--max-session-turns') {
      maxSessionTurns = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--temperature') {
      temperature = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--no-fallback') {
      noFallback = true;
      continue;
    }
    throw new CliUsageError(`Unknown argument: ${token}`);
  }

  if (!bundleDir) {
    throw new CliUsageError('review-gpt requires --bundle <path>.');
  }

  return {
    mode: 'review-gpt',
    bundleDir: resolve(bundleDir),
    ...(model ? { model } : {}),
    ...(baseUrl ? { baseUrl } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(maxSessionTurns !== undefined ? { maxSessionTurns } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    noFallback,
  };
};

export const parseCliArgs = (argv: readonly string[]): CliArgs => {
  if (argv[0] === 'generate') {
    return parseGenerateArgs(argv.slice(1));
  }
  if (argv[0] === 'review-stub') {
    return parseReviewStubArgs(argv.slice(1));
  }
  if (argv[0] === 'review-gpt') {
    return parseReviewGptArgs(argv.slice(1));
  }
  return parseValidateArgs(argv);
};

export const runCli = async (argv: readonly string[], io: CliIo = defaultIo): Promise<number> => {
  try {
    const args = parseCliArgs(argv);

    if (args.mode === 'review-stub') {
      const contractIrPath = resolve(args.bundleDir, 'contract-ir.json');
      const candidatePath = resolve(args.bundleDir, 'candidate.md');
      const validationReportPath = resolve(args.bundleDir, 'validation-report.json');
      const [contractIrSource, candidateMarkdown, validationReportSource] = await Promise.all([
        readFile(contractIrPath, 'utf8'),
        readFile(candidatePath, 'utf8'),
        readFile(validationReportPath, 'utf8'),
      ]);

      const contract = JSON.parse(contractIrSource) as ReturnType<typeof compileAgentOutputContract>;
      const structureReport = JSON.parse(validationReportSource) as ReturnType<typeof toFailureReport>;

      if (!structureReport.ok) {
        io.stderr(`${JSON.stringify({
          ok: false,
          stage: 'review',
          error: 'review-stub requires a structurally valid bundle',
          bundleDir: args.bundleDir,
        }, null, 2)}\n`);
        return 2;
      }

      const reviewReport = buildStubReviewReport(contract, candidateMarkdown, structureReport);
      const written = await writeReviewArtifacts(args.bundleDir, reviewReport);
      io.stdout(`${JSON.stringify({
        ok: reviewReport.ok,
        stage: 'review',
        bundleDir: args.bundleDir,
        reviewReport,
        written,
      }, null, 2)}\n`);
      return reviewReport.ok ? 0 : 1;
    }

    if (args.mode === 'review-gpt') {
      const contractIrPath = resolve(args.bundleDir, 'contract-ir.json');
      const candidatePath = resolve(args.bundleDir, 'candidate.md');
      const validationReportPath = resolve(args.bundleDir, 'validation-report.json');
      const [contractIrSource, candidateMarkdown, validationReportSource] = await Promise.all([
        readFile(contractIrPath, 'utf8'),
        readFile(candidatePath, 'utf8'),
        readFile(validationReportPath, 'utf8'),
      ]);

      const contract = JSON.parse(contractIrSource) as ReturnType<typeof compileAgentOutputContract>;
      const structureReport = JSON.parse(validationReportSource) as ReturnType<typeof toFailureReport>;

      if (!structureReport.ok) {
        io.stderr(`${JSON.stringify({
          ok: false,
          stage: 'review',
          error: 'review-gpt requires a structurally valid bundle',
          bundleDir: args.bundleDir,
        }, null, 2)}\n`);
        return 2;
      }

      const reviewReport = await buildGptReviewReport(contract, candidateMarkdown, structureReport, {
        model: args.model,
        baseUrl: args.baseUrl,
        apiKey: args.apiKey,
        maxSessionTurns: args.maxSessionTurns,
        temperature: args.temperature,
        fallbackToStub: !args.noFallback,
      });
      const written = await writeReviewArtifacts(args.bundleDir, reviewReport);
      io.stdout(`${JSON.stringify({
        ok: reviewReport.ok,
        stage: 'review',
        reviewer: reviewReport.reviewer,
        modelId: reviewReport.modelId,
        bundleDir: args.bundleDir,
        reviewReport,
        written,
      }, null, 2)}\n`);
      return reviewReport.ok ? 0 : 1;
    }

    if (args.mode === 'generate') {
      const contractSource = await readFile(args.contractPath, 'utf8');
      const taskText = args.taskPath ? await readFile(args.taskPath, 'utf8') : args.taskText ?? '';
      const contract = compileAgentOutputContract(contractSource);
      let generation = await generateCandidate({
        mode: args.generator,
        contract,
        taskText,
        attempt: 0,
        model: args.model,
        baseUrl: args.baseUrl,
        apiKey: args.apiKey,
        temperature: args.temperature,
      });

      let responseMarkdown = generation.candidateMarkdown;
      let validation = validateMarkdownResponse(contract, responseMarkdown);
      const repairAttempts: RepairAttemptRecord[] = [];

      while (!validation.ok && repairAttempts.length < contract.repairMaxRetries) {
        const failedReport = toFailureReport(contract, validation);
        const repairPrompt = compileRepairPrompt(contract, validation);
        repairAttempts.push({
          attempt: repairAttempts.length + 1,
          candidateMarkdown: responseMarkdown,
          report: failedReport,
          repairPrompt,
        });

        generation = await generateCandidate({
          mode: args.generator,
          contract,
          taskText,
          attempt: repairAttempts.length,
          repairPrompt,
          previousCandidate: responseMarkdown,
          model: args.model,
          baseUrl: args.baseUrl,
          apiKey: args.apiKey,
          temperature: args.temperature,
        });

        responseMarkdown = generation.candidateMarkdown;
        validation = validateMarkdownResponse(contract, responseMarkdown);
      }

      const document = extractMarkdownSections(responseMarkdown);
      const report = toFailureReport(contract, validation);
      const repairPrompt = validation.ok ? undefined : compileRepairPrompt(contract, validation);
      const exitCode = validation.ok ? 0 : 1;
      const artifacts = args.artifactsRoot
        ? await writeRunArtifacts({
            artifactsRoot: args.artifactsRoot,
            contractPath: args.contractPath,
            responsePath: args.taskPath ? `generated-from:${args.taskPath}` : 'generated-from:inline-task',
            contractSource,
            responseMarkdown,
            contract,
            document,
            report,
            repairPrompt,
            exitCode,
          })
        : undefined;

      const generationArtifacts = artifacts
        ? await writeGenerationArtifacts(artifacts.dir, taskText, generation.report, repairAttempts.length)
        : undefined;

      const repairAttemptArtifacts = artifacts && repairAttempts.length > 0
        ? await writeRepairAttemptArtifacts(artifacts.dir, repairAttempts)
        : undefined;

      const review = validation.ok
        ? buildStubReviewReport(contract, responseMarkdown, report)
        : undefined;
      const reviewArtifacts = review && artifacts
        ? await writeReviewArtifacts(artifacts.dir, review)
        : undefined;

      io.stdout(`${JSON.stringify({
        ok: validation.ok && (!review || review.ok),
        stage: validation.ok ? (review ? 'review' : 'structure') : 'structure',
        contract: {
          name: contract.name,
          version: contract.version,
          path: args.contractPath,
        },
        generation: generation.report,
        structure: report,
        repairAttempts,
        ...(repairPrompt ? { repairPrompt } : {}),
        ...(review ? { review } : {}),
        ...(artifacts ? { artifacts } : {}),
        ...(generationArtifacts ? { generationArtifacts } : {}),
        ...(repairAttemptArtifacts ? { repairAttemptArtifacts } : {}),
        ...(reviewArtifacts ? { reviewArtifacts } : {}),
      }, null, 2)}\n`);
      return review ? (review.ok ? 0 : 1) : exitCode;
    }

    const [contractSource, responseMarkdown] = await Promise.all([
      readFile(args.contractPath, 'utf8'),
      readFile(args.responsePath, 'utf8'),
    ]);

    const contract = compileAgentOutputContract(contractSource);
    const document = extractMarkdownSections(responseMarkdown);
    const validation = validateMarkdownResponse(contract, responseMarkdown);
    const report = toFailureReport(contract, validation);
    const repairPrompt = validation.ok ? undefined : compileRepairPrompt(contract, validation);
    const exitCode = validation.ok ? 0 : 1;
    const artifacts = args.artifactsRoot
      ? await writeRunArtifacts({
          artifactsRoot: args.artifactsRoot,
          contractPath: args.contractPath,
          responsePath: args.responsePath,
          contractSource,
          responseMarkdown,
          contract,
          document,
          report,
          repairPrompt,
          exitCode,
        })
      : undefined;

    const payload = validation.ok
      ? {
          ok: true,
          stage: 'structure',
          contract: {
            name: contract.name,
            version: contract.version,
            path: args.contractPath,
          },
          response: {
            path: args.responsePath,
            sectionHeadings: validation.sections.map((section) => section.heading),
          },
          report,
          ...(artifacts ? { artifacts } : {}),
          failureCount: 0,
        }
      : {
          ok: false,
          stage: 'structure',
          contract: {
            name: contract.name,
            version: contract.version,
            path: args.contractPath,
          },
          response: {
            path: args.responsePath,
            sectionHeadings: validation.sections.map((section) => section.heading),
          },
          report,
          repairPrompt,
          ...(artifacts ? { artifacts } : {}),
          failureCount: validation.failures.length,
        };

    io.stdout(`${JSON.stringify(payload, null, 2)}\n`);
    return exitCode;
  } catch (error) {
    if (error instanceof CliUsageError) {
      const isHelp = error.message === usage;
      const target = isHelp ? io.stdout : io.stderr;
      const payload = isHelp
        ? { ok: true, stage: 'cli', help: usage }
        : { ok: false, stage: 'cli', error: error.message, usage };
      target(`${JSON.stringify(payload, null, 2)}\n`);
      return isHelp ? 0 : 2;
    }

    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`${JSON.stringify({ ok: false, stage: 'cli', error: message }, null, 2)}\n`);
    return 2;
  }
};

const invokedAsScript = (() => {
  const entryArg = process.argv[1];
  if (!entryArg) return false;
  return import.meta.url === pathToFileURL(resolve(entryArg)).href;
})();

if (invokedAsScript) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}

export { usage };
