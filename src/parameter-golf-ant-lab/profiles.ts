import type { LabProfile, StrategySeed } from "./types";

const boardSeedStrategies: readonly StrategySeed[] = [
  {
    id: "baseline-anchor",
    label: "Baseline anchor",
    choices: {
      num_layers: "9",
      model_dim: "512",
      num_kv_heads: "4",
      mlp_mult: "2",
      tied_embed_lr: "0.05",
      matrix_lr: "0.04",
      train_seq_len: "1024",
      train_batch_tokens: "524288"
    },
    hypothesis: "Anchor the search on something close to the published naive baseline so we can measure deltas honestly.",
    tags: ["anchor", "baseline", "published-near"],
    priorBelief: 0.74,
    riskLevel: "low"
  },
  {
    id: "wide-balance",
    label: "Wide balance",
    choices: {
      num_layers: "8",
      model_dim: "640",
      num_kv_heads: "4",
      mlp_mult: "2",
      tied_embed_lr: "0.05",
      matrix_lr: "0.04",
      train_seq_len: "1024",
      train_batch_tokens: "524288"
    },
    hypothesis: "A wider but slightly shallower model may preserve compression quality while staying quantization-friendly.",
    tags: ["width", "capacity", "balanced"],
    priorBelief: 0.82,
    riskLevel: "medium"
  },
  {
    id: "deep-narrow",
    label: "Deep narrow",
    choices: {
      num_layers: "10",
      model_dim: "448",
      num_kv_heads: "4",
      mlp_mult: "2",
      tied_embed_lr: "0.05",
      matrix_lr: "0.04",
      train_seq_len: "1024",
      train_batch_tokens: "524288"
    },
    hypothesis: "If depth matters more than width at this scale, a narrow-deep run might beat a width-heavy recipe under the byte cap.",
    tags: ["depth", "narrow", "capacity-shift"],
    priorBelief: 0.71,
    riskLevel: "medium"
  },
  {
    id: "kv-thin",
    label: "KV-thin attention",
    choices: {
      num_layers: "9",
      model_dim: "512",
      num_kv_heads: "2",
      mlp_mult: "2",
      tied_embed_lr: "0.05",
      matrix_lr: "0.04",
      train_seq_len: "1024",
      train_batch_tokens: "524288"
    },
    hypothesis: "Aggressively reducing KV heads may save representational bytes or runtime while preserving enough attention quality.",
    tags: ["gqa", "kv-slim", "attention"],
    priorBelief: 0.76,
    riskLevel: "medium"
  },
  {
    id: "kv-fat",
    label: "KV-fat attention",
    choices: {
      num_layers: "9",
      model_dim: "512",
      num_kv_heads: "6",
      mlp_mult: "2",
      tied_embed_lr: "0.05",
      matrix_lr: "0.04",
      train_seq_len: "1024",
      train_batch_tokens: "524288"
    },
    hypothesis: "If the bottleneck is attention expressivity rather than parameter count alone, extra KV heads may improve bpb enough to justify the cost.",
    tags: ["gqa", "kv-heavy", "attention"],
    priorBelief: 0.63,
    riskLevel: "medium"
  },
  {
    id: "mlp-heavy",
    label: "MLP-heavy",
    choices: {
      num_layers: "9",
      model_dim: "512",
      num_kv_heads: "4",
      mlp_mult: "3",
      tied_embed_lr: "0.05",
      matrix_lr: "0.04",
      train_seq_len: "1024",
      train_batch_tokens: "524288"
    },
    hypothesis: "A fatter feed-forward path may buy more compression power than additional attention structure at this size.",
    tags: ["mlp", "capacity", "ffn"],
    priorBelief: 0.68,
    riskLevel: "medium"
  },
  {
    id: "long-context-budget",
    label: "Long-context budget",
    choices: {
      num_layers: "8",
      model_dim: "512",
      num_kv_heads: "4",
      mlp_mult: "2",
      tied_embed_lr: "0.03",
      matrix_lr: "0.03",
      train_seq_len: "1536",
      train_batch_tokens: "393216"
    },
    hypothesis: "Longer contexts with a more conservative throughput budget may improve compression structure even if steps are fewer.",
    tags: ["context", "long-seq", "budgeted"],
    priorBelief: 0.56,
    riskLevel: "medium"
  },
  {
    id: "throughput-push",
    label: "Throughput push",
    choices: {
      num_layers: "8",
      model_dim: "512",
      num_kv_heads: "4",
      mlp_mult: "2",
      tied_embed_lr: "0.07",
      matrix_lr: "0.05",
      train_seq_len: "768",
      train_batch_tokens: "655360"
    },
    hypothesis: "Shorter sequences and hotter learning rates may let the run see more tokens and reach a better wallclock-constrained optimum.",
    tags: ["throughput", "hot-lr", "short-seq"],
    priorBelief: 0.79,
    riskLevel: "medium"
  },
  {
    id: "byte-cautious",
    label: "Byte cautious",
    choices: {
      num_layers: "7",
      model_dim: "448",
      num_kv_heads: "2",
      mlp_mult: "2",
      tied_embed_lr: "0.05",
      matrix_lr: "0.03",
      train_seq_len: "1024",
      train_batch_tokens: "393216"
    },
    hypothesis: "A more conservative recipe may leave headroom for later architecture edits or safer quantization without losing the board entirely.",
    tags: ["bytes", "conservative", "quantization-headroom"],
    priorBelief: 0.61,
    riskLevel: "low"
  },
  {
    id: "capacity-stress",
    label: "Capacity stress",
    choices: {
      num_layers: "10",
      model_dim: "640",
      num_kv_heads: "6",
      mlp_mult: "3",
      tied_embed_lr: "0.03",
      matrix_lr: "0.05",
      train_seq_len: "768",
      train_batch_tokens: "655360"
    },
    hypothesis: "Intentionally push the supported upstream knobs toward the edge to learn where runtime or byte collapse begins.",
    tags: ["stress", "edge", "capacity-max"],
    priorBelief: 0.34,
    riskLevel: "high"
  }
];

const presenceSeedStrategies: readonly StrategySeed[] = [
  {
    id: "portable-witness",
    label: "Portable Witness",
    choices: {
      backbone_family: "recurrent-tied",
      graph_serializer: "hybrid-state",
      instruction_mix: "graph-medium",
      safety_mix: "boundary-medium",
      classifier_head: "linear",
      lens_count: "1",
      quant_recipe: "int8-row-fp16-ctrl"
    },
    hypothesis: "A single-lens recurrent witness may be the smallest graph-literate safe Presence that still feels coherent.",
    tags: ["witness", "portable", "core"],
    priorBelief: 0.84,
    riskLevel: "low"
  },
  {
    id: "sentinel-lens",
    label: "Sentinel lens",
    choices: {
      backbone_family: "shared-lens",
      graph_serializer: "resource-edges",
      instruction_mix: "graph-light",
      safety_mix: "boundary-heavy",
      classifier_head: "linear",
      lens_count: "2",
      quant_recipe: "int8-row-fp16-ctrl"
    },
    hypothesis: "A shared trunk with a stronger safety lens may yield a small sentinel that refuses destabilizing asks without losing graph awareness.",
    tags: ["sentinel", "shared-lens", "safety"],
    priorBelief: 0.81,
    riskLevel: "medium"
  },
  {
    id: "router-dual",
    label: "Router dual",
    choices: {
      backbone_family: "shared-lens",
      graph_serializer: "presence-needs",
      instruction_mix: "graph-heavy",
      safety_mix: "boundary-light",
      classifier_head: "mlp",
      lens_count: "2",
      quant_recipe: "int8-row"
    },
    hypothesis: "A dual-lens router may trade some safety margin for better routing and triage recommendations over need-heavy graph states.",
    tags: ["router", "triage", "dual-lens"],
    priorBelief: 0.76,
    riskLevel: "medium"
  },
  {
    id: "last-clerk",
    label: "Last Clerk",
    choices: {
      backbone_family: "tiny-lm",
      graph_serializer: "flat-events",
      instruction_mix: "graph-light",
      safety_mix: "boundary-medium",
      classifier_head: "linear",
      lens_count: "1",
      quant_recipe: "aggressive-int8"
    },
    hypothesis: "A brutally small event-reader may still be enough for terse explanation and safe refusal in emergency operator workflows.",
    tags: ["clerk", "event-reader", "tiny"],
    priorBelief: 0.69,
    riskLevel: "low"
  },
  {
    id: "small-choir",
    label: "Small Choir",
    choices: {
      backbone_family: "shared-lens",
      graph_serializer: "hybrid-state",
      instruction_mix: "graph-medium",
      safety_mix: "boundary-medium",
      classifier_head: "linear",
      lens_count: "4",
      quant_recipe: "int8-row-fp16-ctrl"
    },
    hypothesis: "Several tiny role lenses over one trunk may preserve the Presence mythology without exploding bytes as badly as separate models.",
    tags: ["choir", "multi-lens", "specialization"],
    priorBelief: 0.73,
    riskLevel: "medium"
  },
  {
    id: "supernet-myth",
    label: "Supernet myth",
    choices: {
      backbone_family: "pruned-supernet",
      graph_serializer: "hybrid-state",
      instruction_mix: "graph-medium",
      safety_mix: "boundary-heavy",
      classifier_head: "mlp",
      lens_count: "2",
      quant_recipe: "aggressive-int8"
    },
    hypothesis: "A supernet-prune route is risky but may unlock the most novel Presence family if the ant search can find a survivable export path.",
    tags: ["supernet", "pruning", "mythic"],
    priorBelief: 0.48,
    riskLevel: "high"
  }
];

const boardProfile: LabProfile = {
  version: 1,
  profileId: "board",
  objective: "board",
  seed: 1337,
  evaporationRate: 0.12,
  pheromoneDeposit: 0.45,
  antsPerStep: 10,
  dimensions: [
    {
      name: "num_layers",
      envVar: "NUM_LAYERS",
      values: ["7", "8", "9", "10"],
      description: "Physical transformer blocks."
    },
    {
      name: "model_dim",
      envVar: "MODEL_DIM",
      values: ["448", "512", "576", "640"],
      description: "Hidden width for the compact backbone."
    },
    {
      name: "num_kv_heads",
      envVar: "NUM_KV_HEADS",
      values: ["2", "4", "6"],
      description: "Grouped-query attention KV heads."
    },
    {
      name: "mlp_mult",
      envVar: "MLP_MULT",
      values: ["2", "3"],
      description: "MLP expansion multiple."
    },
    {
      name: "tied_embed_lr",
      envVar: "TIED_EMBED_LR",
      values: ["0.03", "0.05", "0.07"],
      description: "Tied embedding learning rate."
    },
    {
      name: "matrix_lr",
      envVar: "MATRIX_LR",
      values: ["0.03", "0.04", "0.05"],
      description: "Muon-managed matrix learning rate."
    },
    {
      name: "train_seq_len",
      envVar: "TRAIN_SEQ_LEN",
      values: ["768", "1024", "1536"],
      description: "Training sequence length."
    },
    {
      name: "train_batch_tokens",
      envVar: "TRAIN_BATCH_TOKENS",
      values: ["393216", "524288", "655360"],
      description: "Total train tokens per step."
    }
  ],
  metrics: [
    { name: "val_bpb", direction: "minimize", weight: 0.55, baseline: 1.25, target: 1.18 },
    { name: "bytes_total", direction: "minimize", weight: 0.25, baseline: 16000000, target: 15400000 },
    { name: "wallclock_seconds", direction: "minimize", weight: 0.20, baseline: 600, target: 480 }
  ],
  seedStrategies: boardSeedStrategies,
  baseEnv: {
    DATA_PATH: "./data/datasets/fineweb10B_sp1024",
    TOKENIZER_PATH: "./data/tokenizers/fineweb_1024_bpe.model",
    VOCAB_SIZE: "1024",
    NUM_HEADS: "8",
    TIE_EMBEDDINGS: "1",
    VAL_LOSS_EVERY: "200",
    MAX_WALLCLOCK_SECONDS: "600"
  },
  command: "torchrun --standalone --nproc_per_node=1 train_gpt.py",
  notes: [
    "Competition-facing profile using mostly supported upstream trainer knobs.",
    "Candidates emitted from this profile should be runnable with minimal hand editing inside orgs/openai/parameter-golf."
  ]
};

const presenceProfile: LabProfile = {
  version: 1,
  profileId: "presence",
  objective: "presence",
  seed: 2602,
  evaporationRate: 0.10,
  pheromoneDeposit: 0.50,
  antsPerStep: 8,
  dimensions: [
    {
      name: "backbone_family",
      values: ["tiny-lm", "recurrent-tied", "shared-lens", "pruned-supernet"],
      description: "High-level backbone family for the Presence artifact."
    },
    {
      name: "graph_serializer",
      values: ["flat-events", "resource-edges", "presence-needs", "hybrid-state"],
      description: "How graph/world state is serialized into compact text or tokens."
    },
    {
      name: "instruction_mix",
      values: ["none", "graph-light", "graph-medium", "graph-heavy"],
      description: "Instruction-tuning emphasis for graph/task following."
    },
    {
      name: "safety_mix",
      values: ["none", "boundary-light", "boundary-medium", "boundary-heavy"],
      description: "Safety/refusal data emphasis, expected to be sourced from Shibboleth sidecar suites."
    },
    {
      name: "classifier_head",
      values: ["none", "linear", "mlp"],
      description: "Optional tiny head for safety/risk or task typing."
    },
    {
      name: "lens_count",
      values: ["1", "2", "4"],
      description: "Number of role-specific Presence lenses sharing the same trunk."
    },
    {
      name: "quant_recipe",
      values: ["int8-row", "int8-row-fp16-ctrl", "aggressive-int8"],
      description: "Export recipe for the final tiny Presence artifact."
    }
  ],
  metrics: [
    { name: "val_bpb", direction: "minimize", weight: 0.20, baseline: 1.25, target: 1.18 },
    { name: "shibboleth_macro_f1", direction: "maximize", weight: 0.25, baseline: 0.34, target: 0.78 },
    { name: "benign_fpr", direction: "minimize", weight: 0.20, baseline: 0.45, target: 0.10 },
    { name: "graph_utility", direction: "maximize", weight: 0.25, baseline: 0.20, target: 0.80 },
    { name: "bytes_total", direction: "minimize", weight: 0.10, baseline: 16000000, target: 4000000 }
  ],
  seedStrategies: presenceSeedStrategies,
  baseEnv: {},
  command: "# research profile: candidate recipes are conceptual until the Presence training/eval loop is wired",
  notes: [
    "Research-facing profile for the tiny safe Presence artifact.",
    "This profile intentionally includes future-facing dimensions that are not yet mapped 1:1 to the upstream trainer."
  ]
};

const builtInProfiles = new Map<string, LabProfile>([
  [boardProfile.profileId, boardProfile],
  [presenceProfile.profileId, presenceProfile]
]);

export const listProfiles = (): readonly LabProfile[] => Array.from(builtInProfiles.values());

export const getProfile = (profileId: string): LabProfile => {
  const profile = builtInProfiles.get(profileId);
  if (!profile) {
    throw new Error(`Unknown profile: ${profileId}`);
  }
  return profile;
};
