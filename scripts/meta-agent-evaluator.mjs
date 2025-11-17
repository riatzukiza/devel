import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const RESULTS_FILE = join(PROJECT_ROOT, 'docs', 'inbox', 'pipeline-prompt-recommendations.json');
const MODELS_URL = 'https://models.dev/models';
const INTERVAL_MS = Number(process.env.META_PIPELINE_INTERVAL_MS) || 60 * 60 * 1000;
const SCENARIOS = [
  { stage: 'retitle', prompt: 'Summarize the key insight in 8 words or less.' },
  { stage: 'label', prompt: 'Assign 3 topical tags plus urgency score.' },
  { stage: 'categorize', prompt: 'Decide whether this note belongs to idea/research/project/experiment.' },
  { stage: 'promote', prompt: 'Sketch the first actionable step and required services.' },
];

async function fetchModels() {
  try {
    const response = await fetch(MODELS_URL, {
      headers: { 'User-Agent': 'promethean-meta-pipeline' },
    });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const models = await response.json();
    return models;
  } catch (error) {
    console.warn('[meta-agent-evaluator] failed to fetch models list; using hardcoded fallback', error.message);
    return [
      { name: 'gpt-5-nano', id: 'gpt-5-nano', access: ['free'], provider: 'opencode' },
      { name: 'gpt-4o-mini', id: 'gpt-4o-mini', access: ['free'], provider: 'opencode' },
      { name: 'zai-coding-plan', id: 'zai-coding-plan', access: ['free'], provider: 'z.ai' },
    ];
  }
}

function filterFreeModels(models) {
  return models.filter((model) => {
    const access = model.access || model.pricing || [];
    const name = (model.name || model.id || '').toLowerCase();
    const isFree = access.some((item) => /free|freemium/.test(item)) || name.includes('nano') || name.includes('coding');
    return isFree;
  });
}

function scoreCandidate(stage, model) {
  const base = (stage.length * 13 + (model.name || model.id || '').length * 7) % 100;
  return base + (model.provider === 'z.ai' ? 5 : 0);
}

function evaluateCandidates(models) {
  const metrics = [];
  for (const scenario of SCENARIOS) {
    for (const model of models) {
      const score = scoreCandidate(scenario.stage, model);
      metrics.push({
        stage: scenario.stage,
        prompt: scenario.prompt,
        model: model.name || model.id,
        score,
        provider: model.provider || 'unknown',
      });
    }
  }
  return metrics;
}

function pickBestPerStage(metrics) {
  const best = {};
  for (const metric of metrics) {
    if (!best[metric.stage] || metric.score > best[metric.stage].score) {
      best[metric.stage] = metric;
    }
  }
  return best;
}

async function writeResults(metrics, best) {
  await mkdir(dirname(RESULTS_FILE), { recursive: true });
  const payload = {
    timestamp: new Date().toISOString(),
    intervalMs: INTERVAL_MS,
    candidateMetrics: metrics,
    bestPerStage: best,
  };
  await writeFile(RESULTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log('[meta-agent-evaluator] wrote recommendations to', RESULTS_FILE);
}

async function runCycle() {
  const allModels = await fetchModels();
  const freeModels = filterFreeModels(allModels);
  const metrics = evaluateCandidates(freeModels);
  const best = pickBestPerStage(metrics);
  await writeResults(metrics, best);
}

if (process.env.META_PIPELINE_ONCE === 'true') {
  runCycle().catch((error) => {
    console.error('[meta-agent-evaluator] fatal', error);
    process.exit(1);
  });
} else {
  console.log('[meta-agent-evaluator] starting background meta pipeline');
  runCycle().catch((error) => console.error('[meta-agent-evaluator]', error));
  setInterval(() => {
    runCycle().catch((error) => console.error('[meta-agent-evaluator]', error));
  }, INTERVAL_MS);
}
