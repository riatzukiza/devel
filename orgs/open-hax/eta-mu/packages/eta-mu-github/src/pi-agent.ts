import {
  AuthStorage,
  createAgentSession,
  createBashTool,
  createEditTool,
  createExtensionRuntime,
  createReadTool,
  createWriteTool,
  discoverAndLoadExtensions,
  ModelRegistry,
  type ResourceLoader,
  SessionManager,
  SettingsManager,
} from "@open-hax/eta-mu-cli";
import path from "node:path";
import fs from "node:fs";

const extractJson = (text: string): string => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Eta-mu agent did not return JSON: ${text}`);
  }
  return text.slice(start, end + 1);
};

const getAgentDir = (): string | undefined => {
  const explicit = process.env.PI_CODING_AGENT_DIR;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }
  // Fallback: ~/.pi/agent
  const home = process.env.HOME ?? process.env.USERPROFILE;
  if (home) {
    const defaultDir = path.join(home, ".pi", "agent");
    if (fs.existsSync(defaultDir)) {
      return defaultDir;
    }
  }
  return undefined;
};

const createResourceLoader = async (
  systemPrompt: string,
  cwd: string,
  modelRegistry: ModelRegistry,
): Promise<ResourceLoader> => {
  const agentDir = getAgentDir();

  // Create runtime that can queue provider registrations
  const runtime = createExtensionRuntime();

  // Load extensions from agent directory
  const { extensions, errors } = await discoverAndLoadExtensions(
    [], // configuredPaths - we'll discover from agentDir
    cwd,
    agentDir,
    undefined, // eventBus
  );

  if (errors.length > 0) {
    for (const { path, error } of errors) {
      console.error(`eta-mu extension error (${path}): ${error}`);
    }
  }

  // Flush pending provider registrations to the ModelRegistry
  // This connects extensions' pi.registerProvider() calls to the actual registry
  const pending = runtime.pendingProviderRegistrations ?? [];
  for (const { name, config } of pending) {
    modelRegistry.registerProvider(name, config);
  }
  runtime.pendingProviderRegistrations = [];

  return {
    getExtensions: () => ({ extensions, errors, runtime }),
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => systemPrompt,
    getAppendSystemPrompt: () => [],
    extendResources: () => {},
    reload: async () => {},
  };
};

const selectModel = (modelRegistry: ModelRegistry, provider?: string, modelId?: string) => {
  const explicitModel = provider && modelId ? modelRegistry.find(provider, modelId) : undefined;
  return explicitModel ?? modelRegistry.getAvailable()[0];
};

const createBaseSession = async (
  cwd: string,
  systemPrompt: string,
  tools: any[],
  provider?: string,
  modelId?: string,
) => {
  const authStorage = AuthStorage.create();
  const modelRegistry = ModelRegistry.create(authStorage);

  // Load resource loader with extensions from PI_CODING_AGENT_DIR
  // This also flushes pending provider registrations to the ModelRegistry
  const resourceLoader = await createResourceLoader(systemPrompt, cwd, modelRegistry);

  const model = selectModel(modelRegistry, provider, modelId);
  if (!model) {
    throw new Error("No authenticated pi model is available for eta-mu");
  }

  const settingsManager = SettingsManager.inMemory({
    compaction: { enabled: false },
    retry: { enabled: true, maxRetries: 1 },
  });

  return createAgentSession({
    cwd,
    model,
    thinkingLevel: tools.length > 0 ? "medium" : "low",
    authStorage,
    modelRegistry,
    resourceLoader,
    tools,
    sessionManager: SessionManager.inMemory(),
    settingsManager,
  });
};

export const runEtaMuPrompt = async (
  cwd: string,
  systemPrompt: string,
  prompt: string,
  provider?: string,
  modelId?: string,
): Promise<string> => {
  const { session } = await createBaseSession(cwd, systemPrompt, [], provider, modelId);
  let output = "";
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      output += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(prompt);
    return extractJson(output.trim());
  } finally {
    session.dispose();
  }
};

export const runEtaMuAutofix = async (
  cwd: string,
  systemPrompt: string,
  prompt: string,
  provider?: string,
  modelId?: string,
): Promise<string> => {
  const tools = [
    createReadTool(cwd),
    createEditTool(cwd),
    createWriteTool(cwd),
    createBashTool(cwd),
  ];
  const { session } = await createBaseSession(cwd, systemPrompt, tools, provider, modelId);
  let output = "";
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      output += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(prompt);
    return output.trim();
  } finally {
    session.dispose();
  }
};
