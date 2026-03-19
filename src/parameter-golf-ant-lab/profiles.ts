import type { LabProfile } from "./types";

const boardProfile: LabProfile = {
  version: 1,
  profileId: "board",
  objective: "board",
  seed: 1337,
  evaporationRate: 0.12,
  pheromoneDeposit: 0.45,
  antsPerStep: 8,
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
