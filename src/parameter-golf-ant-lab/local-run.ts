import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { readState, resolveLabPaths } from "./io";
import type { CandidateRecipe, LabState } from "./types";

interface ParsedArgs {
  readonly command: "plan" | "run";
  readonly labDir: string;
  readonly profile: string;
  readonly candidateId: string | null;
  readonly image: string;
  readonly repoDir: string;
  readonly iterations: number;
  readonly warmupSteps: number;
  readonly maxWallclockSeconds: number;
  readonly trainLogEvery: number;
  readonly valLossEvery: number;
  readonly valTokens: number;
}

interface LocalRunPlan {
  readonly candidate: CandidateRecipe;
  readonly repoDir: string;
  readonly image: string;
  readonly proxyDataPath: string;
  readonly tokenizerPath: string;
  readonly effectiveTrainBatchTokens: number;
  readonly effectiveValBatchSize: number;
  readonly env: Readonly<Record<string, string>>;
}

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const command = (argv[0] ?? "plan") as "plan" | "run";
  let labDir = "labs/parameter-golf-ant-lab";
  let profile = "board";
  let candidateId: string | null = null;
  let image = "parameter-golf-local:torch2.10-cu128-gcc";
  let repoDir = "orgs/openai/parameter-golf";
  let iterations = 80;
  let warmupSteps = 4;
  let maxWallclockSeconds = 240;
  let trainLogEvery = 10;
  let valLossEvery = 0;
  let valTokens = 2_097_152;

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--lab-dir") {
      labDir = argv[index + 1] ?? labDir;
      index += 1;
      continue;
    }
    if (token === "--profile") {
      profile = argv[index + 1] ?? profile;
      index += 1;
      continue;
    }
    if (token === "--candidate-id") {
      candidateId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (token === "--image") {
      image = argv[index + 1] ?? image;
      index += 1;
      continue;
    }
    if (token === "--repo-dir") {
      repoDir = argv[index + 1] ?? repoDir;
      index += 1;
      continue;
    }
    if (token === "--iterations") {
      iterations = Number(argv[index + 1] ?? iterations);
      index += 1;
      continue;
    }
    if (token === "--warmup-steps") {
      warmupSteps = Number(argv[index + 1] ?? warmupSteps);
      index += 1;
      continue;
    }
    if (token === "--max-wallclock-seconds") {
      maxWallclockSeconds = Number(argv[index + 1] ?? maxWallclockSeconds);
      index += 1;
      continue;
    }
    if (token === "--train-log-every") {
      trainLogEvery = Number(argv[index + 1] ?? trainLogEvery);
      index += 1;
      continue;
    }
    if (token === "--val-loss-every") {
      valLossEvery = Number(argv[index + 1] ?? valLossEvery);
      index += 1;
      continue;
    }
    if (token === "--val-tokens") {
      valTokens = Number(argv[index + 1] ?? valTokens);
      index += 1;
    }
  }

  if (command !== "plan" && command !== "run") {
    throw new Error("Usage: tsx src/parameter-golf-ant-lab/local-run.ts <plan|run> [options]");
  }

  return {
    command,
    labDir,
    profile,
    candidateId,
    image,
    repoDir,
    iterations,
    warmupSteps,
    maxWallclockSeconds,
    trainLogEvery,
    valLossEvery,
    valTokens
  };
};

const readHeader = async (filePath: string): Promise<Int32Array> => {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(256 * 4);
    await handle.read(buffer, 0, buffer.length, 0);
    return new Int32Array(buffer.buffer, buffer.byteOffset, 256);
  } finally {
    await handle.close();
  }
};

const ensureProxyDataset = async (repoDir: string, valTokens: number): Promise<string> => {
  const absRepoDir = path.resolve(repoDir);
  const sourceDir = path.join(absRepoDir, "data", "datasets", "fineweb10B_sp1024");
  const sourceTrain = path.join(sourceDir, "fineweb_train_000000.bin");
  const sourceVal = path.join(sourceDir, "fineweb_val_000000.bin");
  const proxyDir = path.join(absRepoDir, "data", "datasets", `fineweb10B_sp1024_local_proxy_${valTokens}`);
  const proxyTrain = path.join(proxyDir, "fineweb_train_000000.bin");
  const proxyVal = path.join(proxyDir, "fineweb_val_000000.bin");

  await fs.mkdir(proxyDir, { recursive: true });
  let needsTrainLink = false;
  try {
    const stat = await fs.lstat(proxyTrain);
    if (stat.isSymbolicLink()) {
      const target = await fs.readlink(proxyTrain);
      const expected = path.relative(proxyDir, sourceTrain);
      needsTrainLink = target !== expected;
    }
  } catch {
    needsTrainLink = true;
  }
  if (needsTrainLink) {
    await fs.rm(proxyTrain, { force: true });
    await fs.symlink(path.relative(proxyDir, sourceTrain), proxyTrain);
  }

  let needsValWrite = false;
  try {
    const existingHeader = await readHeader(proxyVal);
    needsValWrite = existingHeader[2] !== valTokens;
  } catch {
    needsValWrite = true;
  }

  if (!needsValWrite) {
    return proxyDir;
  }

  const headerBytes = 256 * 4;
  const tokenBytes = 2;
  const sourceHeader = await readHeader(sourceVal);
  const availableTokens = Number(sourceHeader[2]);
  const clippedTokens = Math.min(valTokens, availableTokens);
  const sourceHandle = await fs.open(sourceVal, "r");
  const targetHandle = await fs.open(proxyVal, "w");
  try {
    const headerBuffer = Buffer.alloc(headerBytes);
    await sourceHandle.read(headerBuffer, 0, headerBytes, 0);
    headerBuffer.writeInt32LE(clippedTokens, 2 * 4);
    await targetHandle.write(headerBuffer, 0, headerBytes, 0);

    const chunkSize = 4 * 1024 * 1024;
    let remainingBytes = clippedTokens * tokenBytes;
    let sourceOffset = headerBytes;
    let targetOffset = headerBytes;
    while (remainingBytes > 0) {
      const nextSize = Math.min(chunkSize, remainingBytes);
      const chunk = Buffer.alloc(nextSize);
      await sourceHandle.read(chunk, 0, nextSize, sourceOffset);
      await targetHandle.write(chunk, 0, nextSize, targetOffset);
      remainingBytes -= nextSize;
      sourceOffset += nextSize;
      targetOffset += nextSize;
    }
  } finally {
    await sourceHandle.close();
    await targetHandle.close();
  }

  return proxyDir;
};

const parseInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundDown = (value: number, quantum: number): number => Math.max(quantum, Math.floor(value / quantum) * quantum);

const deriveLocalTrainBatchTokens = (candidate: CandidateRecipe): number => {
  const numLayers = parseInteger(candidate.choices.num_layers, 9);
  const modelDim = parseInteger(candidate.choices.model_dim, 512);
  const trainSeqLen = parseInteger(candidate.choices.train_seq_len, 1024);
  const candidateBatch = parseInteger(candidate.choices.train_batch_tokens, 524288);
  const referenceComplexity = 9 * 512 * 1024;
  const complexity = Math.max(1, numLayers * modelDim * trainSeqLen);
  const rawBudget = 65536 * (referenceComplexity / complexity);
  const clampedBudget = Math.min(candidateBatch, Math.max(32768, Math.min(131072, rawBudget)));
  return roundDown(clampedBudget, trainSeqLen * 8);
};

const findCandidate = (state: LabState, candidateId: string | null): CandidateRecipe => {
  if (candidateId) {
    const exact = state.candidates.find((candidate) => candidate.id === candidateId);
    if (!exact) {
      throw new Error(`Unknown candidate id: ${candidateId}`);
    }
    return exact;
  }
  const top = state.candidates.find((candidate) => candidate.status === "proposed") ?? state.candidates[0];
  if (!top) {
    throw new Error("No candidate found in lab state. Generate a suggestion step first.");
  }
  return top;
};

const buildPlan = async (args: ParsedArgs): Promise<LocalRunPlan> => {
  if (args.profile !== "board") {
    throw new Error("Local GPU runner currently supports --profile board only.");
  }
  const paths = resolveLabPaths(args.labDir, args.profile);
  const state = await readState(paths);
  const candidate = findCandidate(state, args.candidateId);
  const absRepoDir = path.resolve(args.repoDir);
  const proxyDataPath = await ensureProxyDataset(absRepoDir, args.valTokens);
  const effectiveTrainBatchTokens = deriveLocalTrainBatchTokens(candidate);
  const effectiveValBatchSize = effectiveTrainBatchTokens;

  const env: Record<string, string> = {
    DATA_PATH: "/workspace/parameter-golf/data/datasets/" + path.basename(proxyDataPath),
    TOKENIZER_PATH: "/workspace/parameter-golf/data/tokenizers/fineweb_1024_bpe.model",
    VOCAB_SIZE: "1024",
    NUM_HEADS: "8",
    TIE_EMBEDDINGS: "1",
    RUN_ID: `local-${candidate.id}`,
    ITERATIONS: String(args.iterations),
    WARMUP_STEPS: String(args.warmupSteps),
    TRAIN_LOG_EVERY: String(args.trainLogEvery),
    VAL_LOSS_EVERY: String(args.valLossEvery),
    MAX_WALLCLOCK_SECONDS: String(args.maxWallclockSeconds),
    TRAIN_BATCH_TOKENS: String(effectiveTrainBatchTokens),
    VAL_BATCH_SIZE: String(effectiveValBatchSize),
    OMP_NUM_THREADS: "1",
    PYTORCH_CUDA_ALLOC_CONF: "expandable_segments:True",
    TORCHINDUCTOR_COMPILE_THREADS: "1",
    NCCL_IB_DISABLE: "1",
    CC: "gcc",
    CXX: "g++"
  };

  for (const [name, value] of Object.entries(candidate.choices)) {
    const mapping: Record<string, string> = {
      num_layers: "NUM_LAYERS",
      model_dim: "MODEL_DIM",
      num_kv_heads: "NUM_KV_HEADS",
      mlp_mult: "MLP_MULT",
      tied_embed_lr: "TIED_EMBED_LR",
      matrix_lr: "MATRIX_LR",
      train_seq_len: "TRAIN_SEQ_LEN",
      train_batch_tokens: "TRAIN_BATCH_TOKENS"
    };
    const envVar = mapping[name];
    if (envVar) {
      env[envVar] = name === "train_batch_tokens" ? String(effectiveTrainBatchTokens) : value;
    }
  }

  return {
    candidate,
    repoDir: absRepoDir,
    image: args.image,
    proxyDataPath,
    tokenizerPath: path.join(absRepoDir, "data", "tokenizers", "fineweb_1024_bpe.model"),
    effectiveTrainBatchTokens,
    effectiveValBatchSize,
    env
  };
};

const imageExists = async (image: string): Promise<boolean> => new Promise((resolve) => {
  const proc = spawn("docker", ["image", "inspect", image], { stdio: "ignore" });
  proc.on("exit", (code) => resolve(code === 0));
});

const ensureImage = async (image: string, repoDir: string): Promise<void> => {
  if (await imageExists(image)) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("docker", [
      "build",
      "-f",
      path.join(repoDir, "Dockerfile.local-gpu"),
      "-t",
      image,
      repoDir
    ], { stdio: "inherit" });
    proc.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`docker build failed with exit code ${code ?? -1}`)));
  });
};

const formatEnvScript = (env: Readonly<Record<string, string>>): string => Object.entries(env)
  .map(([name, value]) => `${name}=${value}`)
  .join(" \\\n");

const parseMetrics = (logText: string): Readonly<Record<string, number>> => {
  const valMatch = logText.match(/final_int8_zlib_roundtrip_exact val_loss:([0-9.]+) val_bpb:([0-9.]+)/);
  const bytesMatch = logText.match(/Total submission size int8\+zlib: ([0-9]+) bytes/);
  const trainTimeMatch = [...logText.matchAll(/train_time:([0-9]+)ms/g)].at(-1);
  const result: Record<string, number> = {};
  if (valMatch) {
    result.val_loss = Number(valMatch[1]);
    result.val_bpb = Number(valMatch[2]);
  }
  if (bytesMatch) {
    result.bytes_total = Number(bytesMatch[1]);
  }
  if (trainTimeMatch) {
    result.train_time_ms = Number(trainTimeMatch[1]);
  }
  return result;
};

const runPlan = async (plan: LocalRunPlan, args: ParsedArgs): Promise<Readonly<Record<string, unknown>>> => {
  await ensureImage(plan.image, plan.repoDir);
  const timestamp = new Date().toISOString().replace(/[:]/g, "-");
  const runDir = path.resolve(args.labDir, "runs", args.profile, `${timestamp}-${plan.candidate.id}`);
  await fs.mkdir(runDir, { recursive: true });
  const logPath = path.join(runDir, "train.log");
  const planPath = path.join(runDir, "plan.json");
  await fs.writeFile(planPath, `${JSON.stringify({ plan, args }, null, 2)}\n`, "utf8");

  const envExports = Object.entries(plan.env)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join(" ");
  const dockerArgs = [
    "run",
    "--rm",
    "--gpus",
    "all",
    "-v",
    `${plan.repoDir}:/workspace/parameter-golf`,
    "-v",
    `${runDir}:/workspace/run`,
    "-w",
    "/workspace/run",
    plan.image,
    "bash",
    "-lc",
    `set -o pipefail && ${envExports} python /workspace/parameter-golf/train_gpt.py 2>&1 | tee /workspace/run/train.log`
  ];

  const startedAt = Date.now();
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("docker", dockerArgs, { stdio: "inherit" });
    proc.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`local run failed with exit code ${code ?? -1}`)));
  });
  const wallclockSeconds = (Date.now() - startedAt) / 1000;
  const logText = await fs.readFile(logPath, "utf8");
  const parsedMetrics = parseMetrics(logText);
  const result = {
    candidateId: plan.candidate.id,
    strategy: plan.candidate.strategyLabel,
    runDir,
    logPath,
    wallclockSeconds,
    parsedMetrics,
    effectiveTrainBatchTokens: plan.effectiveTrainBatchTokens,
    effectiveValBatchSize: plan.effectiveValBatchSize,
    proxyDataPath: plan.proxyDataPath
  };
  await fs.writeFile(path.join(runDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return result;
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const plan = await buildPlan(args);
  if (args.command === "plan") {
    process.stdout.write(`${JSON.stringify({
      candidateId: plan.candidate.id,
      strategy: plan.candidate.strategyLabel,
      hypothesis: plan.candidate.hypothesis,
      risk: plan.candidate.riskLevel,
      compositeScore: plan.candidate.compositeScore,
      effectiveTrainBatchTokens: plan.effectiveTrainBatchTokens,
      effectiveValBatchSize: plan.effectiveValBatchSize,
      proxyDataPath: plan.proxyDataPath,
      env: plan.env,
      dockerImage: plan.image,
      dockerfile: path.join(plan.repoDir, "Dockerfile.local-gpu"),
      envScript: formatEnvScript(plan.env)
    }, null, 2)}\n`);
    return;
  }
  const result = await runPlan(plan, args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
