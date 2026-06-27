/**
 * Main entry point for the coding agent CLI.
 *
 * This file handles CLI argument parsing and translates them into
 * createAgentSession() options. The SDK does the heavy lifting.
 */

import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { type AttachmentContent, type ImageContent, modelsAreEqual, supportsXhigh } from "@open-hax/eta-mu-ai";
import { ProcessTerminal, setKeybindings, TUI } from "@open-hax/eta-mu-tui";
import chalk from "chalk";
import { type Args, type Mode, parseArgs, printHelp } from "./cli/args.js";
import { processFileArguments } from "./cli/file-processor.js";
import { buildInitialMessage } from "./cli/initial-message.js";
import { listModels } from "./cli/list-models.js";
import { selectSession } from "./cli/session-picker.js";
import { APP_NAME, ensureProjectConfigDir, getAgentDir, VERSION } from "./config.js";
import { type CreateAgentSessionRuntimeFactory, createAgentSessionRuntime } from "./core/agent-session-runtime.js";
import {
	type AgentSessionRuntimeDiagnostic,
	createAgentSessionFromServices,
	createAgentSessionServices,
} from "./core/agent-session-services.js";
import { formatNoModelsAvailableMessage } from "./core/auth-guidance.js";
import { AuthStorage } from "./core/auth-storage.js";
import { exportFromFile } from "./core/export-html/index.js";
import type { ExtensionFactory } from "./core/extensions/types.js";
import { KeybindingsManager } from "./core/keybindings.js";
import type { ModelRegistry } from "./core/model-registry.js";
import { resolveCliModel, resolveModelScope, type ScopedModel } from "./core/model-resolver.js";
import { restoreStdout, takeOverStdout } from "./core/output-guard.js";
import type { CreateAgentSessionOptions } from "./core/sdk.js";
import {
	formatMissingSessionCwdPrompt,
	getMissingSessionCwdIssue,
	MissingSessionCwdError,
	type SessionCwdIssue,
} from "./core/session-cwd.js";
import { SessionManager } from "./core/session-manager.js";
import { SettingsManager } from "./core/settings-manager.js";
import { printTimings, resetTimings, time } from "./core/timings.js";
import { runMigrations, showDeprecationWarnings } from "./migrations.js";
import { InteractiveMode, runPrintMode, runRpcMode } from "./modes/index.js";
import { ExtensionSelectorComponent } from "./modes/interactive/components/extension-selector.js";
import { initTheme, stopThemeWatcher } from "./modes/interactive/theme/theme.js";
import { handleConfigCommand, handlePackageCommand } from "./package-manager-cli.js";
import { isLocalPath } from "./utils/paths.js";

/**
 * Read all content from piped stdin.
 * Returns undefined if stdin is a TTY (interactive terminal).
 */
async function readPipedStdin(): Promise<string | undefined> {
	// If stdin is a TTY, we're running interactively - don't read stdin
	if (process.stdin.isTTY) {
		return undefined;
	}

	return new Promise((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => {
			data += chunk;
		});
		process.stdin.on("end", () => {
			resolve(data.trim() || undefined);
		});
		process.stdin.resume();
	});
}

function collectSettingsDiagnostics(
	settingsManager: SettingsManager,
	context: string,
): AgentSessionRuntimeDiagnostic[] {
	return settingsManager.drainErrors().map(({ scope, error }) => ({
		type: "warning",
		message: `(${context}, ${scope} settings) ${error.message}`,
	}));
}

function reportDiagnostics(diagnostics: readonly AgentSessionRuntimeDiagnostic[]): void {
	for (const diagnostic of diagnostics) {
		const color = diagnostic.type === "error" ? chalk.red : diagnostic.type === "warning" ? chalk.yellow : chalk.dim;
		const prefix = diagnostic.type === "error" ? "Error: " : diagnostic.type === "warning" ? "Warning: " : "";
		console.error(color(`${prefix}${diagnostic.message}`));
	}
}

function isTruthyEnvFlag(value: string | undefined): boolean {
	if (!value) return false;
	return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

type AppMode = "interactive" | "print" | "json" | "rpc";

function resolveAppMode(parsed: Args, stdinIsTTY: boolean): AppMode {
	if (parsed.mode === "rpc") {
		return "rpc";
	}
	if (parsed.mode === "json") {
		return "json";
	}
	if (parsed.print || !stdinIsTTY) {
		return "print";
	}
	return "interactive";
}

function toPrintOutputMode(appMode: AppMode): Exclude<Mode, "rpc"> {
	return appMode === "json" ? "json" : "text";
}

async function prepareInitialMessage(
	parsed: Args,
	autoResizeImages: boolean,
	stdinContent?: string,
): Promise<{
	initialMessage?: string;
	initialImages?: ImageContent[];
	initialAttachments?: AttachmentContent[];
}> {
	if (parsed.fileArgs.length === 0) {
		return buildInitialMessage({ parsed, stdinContent });
	}

	const { text, images, attachments } = await processFileArguments(parsed.fileArgs, { autoResizeImages });
	return buildInitialMessage({
		parsed,
		fileText: text,
		fileImages: images,
		fileAttachments: attachments,
		stdinContent,
	});
}

/** Result from resolving a session argument */
type ResolvedSession =
	| { type: "path"; path: string } // Direct file path
	| { type: "local"; path: string } // Found in current project
	| { type: "global"; path: string; cwd: string } // Found in different project
	| { type: "not_found"; arg: string }; // Not found anywhere

/**
 * Resolve a session argument to a file path.
 * If it looks like a path, use as-is. Otherwise try to match as session ID prefix.
 */
async function resolveSessionPath(sessionArg: string, cwd: string, sessionDir?: string): Promise<ResolvedSession> {
	// If it looks like a file path, use as-is
	if (sessionArg.includes("/") || sessionArg.includes("\\") || sessionArg.endsWith(".jsonl")) {
		return { type: "path", path: sessionArg };
	}

	// Try to match as session ID in current project first
	const localSessions = await SessionManager.list(cwd, sessionDir);
	const localMatches = localSessions.filter((s) => s.id.startsWith(sessionArg));

	if (localMatches.length >= 1) {
		return { type: "local", path: localMatches[0].path };
	}

	// Try global search across all projects
	const allSessions = await SessionManager.listAll();
	const globalMatches = allSessions.filter((s) => s.id.startsWith(sessionArg));

	if (globalMatches.length >= 1) {
		const match = globalMatches[0];
		return { type: "global", path: match.path, cwd: match.cwd };
	}

	// Not found anywhere
	return { type: "not_found", arg: sessionArg };
}

/** Prompt user for yes/no confirmation */
async function promptConfirm(message: string): Promise<boolean> {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(`${message} [y/N] `, (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
		});
	});
}

function validateForkFlags(parsed: Args): void {
	if (!parsed.fork) return;

	const conflictingFlags = [
		parsed.session ? "--session" : undefined,
		parsed.continue ? "--continue" : undefined,
		parsed.resume ? "--resume" : undefined,
		parsed.noSession ? "--no-session" : undefined,
	].filter((flag): flag is string => flag !== undefined);

	if (conflictingFlags.length > 0) {
		console.error(chalk.red(`Error: --fork cannot be combined with ${conflictingFlags.join(", ")}`));
		process.exit(1);
	}
}

function forkSessionOrExit(sourcePath: string, cwd: string, sessionDir?: string): SessionManager {
	try {
		return SessionManager.forkFrom(sourcePath, cwd, sessionDir);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(chalk.red(`Error: ${message}`));
		process.exit(1);
	}
}

async function createSessionManager(
	parsed: Args,
	cwd: string,
	sessionDir: string | undefined,
	settingsManager: SettingsManager,
): Promise<SessionManager> {
	if (parsed.noSession) {
		return SessionManager.inMemory();
	}

	if (parsed.fork) {
		const resolved = await resolveSessionPath(parsed.fork, cwd, sessionDir);

		switch (resolved.type) {
			case "path":
			case "local":
			case "global":
				return forkSessionOrExit(resolved.path, cwd, sessionDir);

			case "not_found":
				console.error(chalk.red(`No session found matching '${resolved.arg}'`));
				process.exit(1);
		}
	}

	if (parsed.session) {
		const resolved = await resolveSessionPath(parsed.session, cwd, sessionDir);

		switch (resolved.type) {
			case "path":
			case "local":
				return SessionManager.open(resolved.path, sessionDir);

			case "global": {
				console.log(chalk.yellow(`Session found in different project: ${resolved.cwd}`));
				const shouldFork = await promptConfirm("Fork this session into current directory?");
				if (!shouldFork) {
					console.log(chalk.dim("Aborted."));
					process.exit(0);
				}
				return forkSessionOrExit(resolved.path, cwd, sessionDir);
			}

			case "not_found":
				console.error(chalk.red(`No session found matching '${resolved.arg}'`));
				process.exit(1);
		}
	}

	if (parsed.resume) {
		initTheme(settingsManager.getTheme(), true);
		try {
			const selectedPath = await selectSession(
				(onProgress) => SessionManager.list(cwd, sessionDir, onProgress),
				SessionManager.listAll,
			);
			if (!selectedPath) {
				console.log(chalk.dim("No session selected"));
				process.exit(0);
			}
			return SessionManager.open(selectedPath, sessionDir);
		} finally {
			stopThemeWatcher();
		}
	}

	if (parsed.continue) {
		return SessionManager.continueRecent(cwd, sessionDir);
	}

	return SessionManager.create(cwd, sessionDir);
}

function buildSessionOptions(
	parsed: Args,
	scopedModels: ScopedModel[],
	hasExistingSession: boolean,
	modelRegistry: ModelRegistry,
	settingsManager: SettingsManager,
): {
	options: CreateAgentSessionOptions;
	cliThinkingFromModel: boolean;
	diagnostics: AgentSessionRuntimeDiagnostic[];
} {
	const options: CreateAgentSessionOptions = {};
	const diagnostics: AgentSessionRuntimeDiagnostic[] = [];
	let cliThinkingFromModel = false;

	// Model from CLI
	// - supports --provider <name> --model <pattern>
	// - supports --model <provider>/<pattern>
	if (parsed.model) {
		const resolved = resolveCliModel({
			cliProvider: parsed.provider,
			cliModel: parsed.model,
			modelRegistry,
		});
		if (resolved.warning) {
			diagnostics.push({ type: "warning", message: resolved.warning });
		}
		if (resolved.error) {
			diagnostics.push({ type: "error", message: resolved.error });
		}
		if (resolved.model) {
			options.model = resolved.model;
			// Allow "--model <pattern>:<thinking>" as a shorthand.
			// Explicit --thinking still takes precedence (applied later).
			if (!parsed.thinking && resolved.thinkingLevel) {
				options.thinkingLevel = resolved.thinkingLevel;
				cliThinkingFromModel = true;
			}
		}
	}

	if (!options.model && scopedModels.length > 0 && !hasExistingSession) {
		// Check if saved default is in scoped models - use it if so, otherwise first scoped model
		const savedProvider = settingsManager.getDefaultProvider();
		const savedModelId = settingsManager.getDefaultModel();
		const savedModel = savedProvider && savedModelId ? modelRegistry.find(savedProvider, savedModelId) : undefined;
		const savedInScope = savedModel ? scopedModels.find((sm) => modelsAreEqual(sm.model, savedModel)) : undefined;

		if (savedInScope) {
			options.model = savedInScope.model;
			// Use thinking level from scoped model config if explicitly set
			if (!parsed.thinking && savedInScope.thinkingLevel) {
				options.thinkingLevel = savedInScope.thinkingLevel;
			}
		} else {
			options.model = scopedModels[0].model;
			// Use thinking level from first scoped model if explicitly set
			if (!parsed.thinking && scopedModels[0].thinkingLevel) {
				options.thinkingLevel = scopedModels[0].thinkingLevel;
			}
		}
	}

	// Thinking level from CLI (takes precedence over scoped model thinking levels set above)
	if (parsed.thinking) {
		options.thinkingLevel = parsed.thinking;
	}

	// Scoped models for Ctrl+P cycling
	// Keep thinking level undefined when not explicitly set in the model pattern.
	// Undefined means "inherit current session thinking level" during cycling.
	if (scopedModels.length > 0) {
		options.scopedModels = scopedModels.map((sm) => ({
			model: sm.model,
			thinkingLevel: sm.thinkingLevel,
		}));
	}

	// API key from CLI - set in authStorage
	// (handled by caller before createAgentSession)

	// Tools
	if (parsed.noTools) {
		options.noTools = "all";
	} else if (parsed.noBuiltinTools) {
		options.noTools = "builtin";
	}
	if (parsed.tools) {
		options.tools = [...parsed.tools];
	}

	return { options, cliThinkingFromModel, diagnostics };
}

function resolveCliPaths(cwd: string, paths: string[] | undefined): string[] | undefined {
	return paths?.map((value) => (isLocalPath(value) ? resolve(cwd, value) : value));
}

async function promptForMissingSessionCwd(
	issue: SessionCwdIssue,
	settingsManager: SettingsManager,
): Promise<string | undefined> {
	initTheme(settingsManager.getTheme());
	setKeybindings(KeybindingsManager.create());

	return new Promise((resolve) => {
		const ui = new TUI(new ProcessTerminal(), settingsManager.getShowHardwareCursor());
		ui.setClearOnShrink(settingsManager.getClearOnShrink());

		let settled = false;
		const finish = (result: string | undefined) => {
			if (settled) {
				return;
			}
			settled = true;
			ui.stop();
			resolve(result);
		};

		const selector = new ExtensionSelectorComponent(
			formatMissingSessionCwdPrompt(issue),
			["Continue", "Cancel"],
			(option) => finish(option === "Continue" ? issue.fallbackCwd : undefined),
			() => finish(undefined),
			{ tui: ui },
		);
		ui.addChild(selector);
		ui.setFocus(selector);
		ui.start();
	});
}

export interface MainOptions {
	extensionFactories?: ExtensionFactory[];
}

export async function main(args: string[], options?: MainOptions) {
	resetTimings();
	const offlineMode = args.includes("--offline") || isTruthyEnvFlag(process.env.ETA_MU_OFFLINE);
	if (offlineMode) {
		process.env.ETA_MU_OFFLINE = "1";
		process.env.ETA_MU_SKIP_VERSION_CHECK = "1";
	}

	if (await handlePackageCommand(args)) {
		return;
	}

	if (await handleConfigCommand(args)) {
		return;
	}

	// Find `kanban` as a command — skip flag values (--extension <path>, etc.)
	const KNOWN_FLAGS_WITH_VALUES = new Set(["--extension", "--config", "--tasks-dir", "--port", "--host", "--mode", "--model", "--provider", "--api-key", "--session", "--fork", "--session-dir", "--export", "--skills", "--themes", "--prompt-templates"]);
	let kanbanIdx = -1;
	for (let i = 0; i < args.length; i++) {
		if (KNOWN_FLAGS_WITH_VALUES.has(args[i])) {
			i++; // skip the flag's value
			continue;
		}
		if (args[i] === "kanban") {
			kanbanIdx = i;
			break;
		}
	}
	if (kanbanIdx >= 0) {
		await handleKanbanCommand(args.slice(kanbanIdx + 1));
		return;
	}

	const parsed = parseArgs(args);
	if (parsed.diagnostics.length > 0) {
		for (const d of parsed.diagnostics) {
			const color = d.type === "error" ? chalk.red : chalk.yellow;
			console.error(color(`${d.type === "error" ? "Error" : "Warning"}: ${d.message}`));
		}
		if (parsed.diagnostics.some((d) => d.type === "error")) {
			process.exit(1);
		}
	}
	time("parseArgs");
	let appMode = resolveAppMode(parsed, process.stdin.isTTY);
	const shouldTakeOverStdout = appMode !== "interactive";
	if (shouldTakeOverStdout) {
		takeOverStdout();
	}

	if (parsed.version) {
		const { createSurfaceCommandResult } = await import("@open-hax/eta-mu-runtime/cljs");
		const versionResult = createSurfaceCommandResult({ command: "version", value: VERSION });
		console.log(versionResult.stdout);
		process.exit(versionResult.exitCode);
	}

	if (parsed.export) {
		let result: string;
		try {
			const outputPath = parsed.messages.length > 0 ? parsed.messages[0] : undefined;
			result = await exportFromFile(parsed.export, outputPath);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Failed to export session";
			console.error(chalk.red(`Error: ${message}`));
			process.exit(1);
		}
		console.log(`Exported to: ${result}`);
		process.exit(0);
	}

	if (parsed.mode === "rpc" && parsed.fileArgs.length > 0) {
		console.error(chalk.red("Error: @file arguments are not supported in RPC mode"));
		process.exit(1);
	}

	validateForkFlags(parsed);

	const cwd = process.cwd();
	ensureProjectConfigDir(cwd);

	// Run migrations (pass cwd for project-local migrations)
	const { migratedAuthProviders: migratedProviders, deprecationWarnings } = runMigrations(cwd);
	time("runMigrations");

	const agentDir = getAgentDir();
	const startupSettingsManager = SettingsManager.create(cwd, agentDir);
	reportDiagnostics(collectSettingsDiagnostics(startupSettingsManager, "startup session lookup"));

	// Decide the final runtime cwd before creating cwd-bound runtime services.
	// --session and --resume may select a session from another project, so project-local
	// settings, resources, provider registrations, and models must be resolved only after
	// the target session cwd is known. The startup-cwd settings manager is used only for
	// sessionDir lookup during session selection.
	const sessionDir = parsed.sessionDir ?? startupSettingsManager.getSessionDir();
	let sessionManager = await createSessionManager(parsed, cwd, sessionDir, startupSettingsManager);
	const missingSessionCwdIssue = getMissingSessionCwdIssue(sessionManager, cwd);
	if (missingSessionCwdIssue) {
		if (appMode === "interactive") {
			const selectedCwd = await promptForMissingSessionCwd(missingSessionCwdIssue, startupSettingsManager);
			if (!selectedCwd) {
				process.exit(0);
			}
			sessionManager = SessionManager.open(missingSessionCwdIssue.sessionFile!, sessionDir, selectedCwd);
		} else {
			console.error(chalk.red(new MissingSessionCwdError(missingSessionCwdIssue).message));
			process.exit(1);
		}
	}
	ensureProjectConfigDir(sessionManager.getCwd());
	time("createSessionManager");

	const resolvedExtensionPaths = resolveCliPaths(cwd, parsed.extensions);
	const resolvedSkillPaths = resolveCliPaths(cwd, parsed.skills);
	const resolvedPromptTemplatePaths = resolveCliPaths(cwd, parsed.promptTemplates);
	const resolvedThemePaths = resolveCliPaths(cwd, parsed.themes);
	const authStorage = AuthStorage.create();
	const createRuntime: CreateAgentSessionRuntimeFactory = async ({
		cwd,
		agentDir,
		sessionManager,
		sessionStartEvent,
	}) => {
		const services = await createAgentSessionServices({
			cwd,
			agentDir,
			authStorage,
			extensionFlagValues: parsed.unknownFlags,
			resourceLoaderOptions: {
				additionalExtensionPaths: resolvedExtensionPaths,
				additionalSkillPaths: resolvedSkillPaths,
				additionalPromptTemplatePaths: resolvedPromptTemplatePaths,
				additionalThemePaths: resolvedThemePaths,
				noExtensions: parsed.noExtensions,
				noSkills: parsed.noSkills,
				noPromptTemplates: parsed.noPromptTemplates,
				noThemes: parsed.noThemes,
				noContextFiles: parsed.noContextFiles,
				systemPrompt: parsed.systemPrompt,
				appendSystemPrompt: parsed.appendSystemPrompt,
				extensionFactories: options?.extensionFactories,
			},
		});
		const { settingsManager, modelRegistry, resourceLoader } = services;
		const diagnostics: AgentSessionRuntimeDiagnostic[] = [
			...services.diagnostics,
			...collectSettingsDiagnostics(settingsManager, "runtime creation"),
			...resourceLoader.getExtensions().errors.map(({ path, error }) => ({
				type: "error" as const,
				message: `Failed to load extension "${path}": ${error}`,
			})),
		];

		const modelPatterns = parsed.models ?? settingsManager.getEnabledModels();
		const scopedModels =
			modelPatterns && modelPatterns.length > 0 ? await resolveModelScope(modelPatterns, modelRegistry) : [];
		const {
			options: sessionOptions,
			cliThinkingFromModel,
			diagnostics: sessionOptionDiagnostics,
		} = buildSessionOptions(
			parsed,
			scopedModels,
			sessionManager.buildSessionContext().messages.length > 0,
			modelRegistry,
			settingsManager,
		);
		diagnostics.push(...sessionOptionDiagnostics);

		if (parsed.apiKey) {
			if (!sessionOptions.model) {
				diagnostics.push({
					type: "error",
					message: "--api-key requires a model to be specified via --model, --provider/--model, or --models",
				});
			} else {
				authStorage.setRuntimeApiKey(sessionOptions.model.provider, parsed.apiKey);
			}
		}

		const created = await createAgentSessionFromServices({
			services,
			sessionManager,
			sessionStartEvent,
			model: sessionOptions.model,
			thinkingLevel: sessionOptions.thinkingLevel,
			scopedModels: sessionOptions.scopedModels,
			tools: sessionOptions.tools,
			noTools: sessionOptions.noTools,
			customTools: sessionOptions.customTools,
		});
		const cliThinkingOverride = parsed.thinking !== undefined || cliThinkingFromModel;
		if (created.session.model && cliThinkingOverride) {
			let effectiveThinking = created.session.thinkingLevel;
			if (!created.session.model.reasoning) {
				effectiveThinking = "off";
			} else if (effectiveThinking === "xhigh" && !supportsXhigh(created.session.model)) {
				effectiveThinking = "high";
			}
			if (effectiveThinking !== created.session.thinkingLevel) {
				created.session.setThinkingLevel(effectiveThinking);
			}
		}

		return {
			...created,
			services,
			diagnostics,
		};
	};
	time("createRuntime");
	const runtime = await createAgentSessionRuntime(createRuntime, {
		cwd: sessionManager.getCwd(),
		agentDir,
		sessionManager,
	});
	const { services, session, modelFallbackMessage } = runtime;
	const { settingsManager, modelRegistry, resourceLoader } = services;

	if (parsed.help) {
		const extensionFlags = resourceLoader
			.getExtensions()
			.extensions.flatMap((extension) => Array.from(extension.flags.values()));
		printHelp(extensionFlags);
		process.exit(0);
	}

	if (parsed.listModels !== undefined) {
		const searchPattern = typeof parsed.listModels === "string" ? parsed.listModels : undefined;
		await listModels(modelRegistry, searchPattern);
		process.exit(0);
	}

	// Read piped stdin content (if any) - skip for RPC mode which uses stdin for JSON-RPC
	let stdinContent: string | undefined;
	if (appMode !== "rpc") {
		stdinContent = await readPipedStdin();
		if (stdinContent !== undefined && appMode === "interactive") {
			appMode = "print";
		}
	}
	time("readPipedStdin");

	const { initialMessage, initialImages, initialAttachments } = await prepareInitialMessage(
		parsed,
		settingsManager.getImageAutoResize(),
		stdinContent,
	);
	time("prepareInitialMessage");
	initTheme(settingsManager.getTheme(), appMode === "interactive");
	time("initTheme");

	// Show deprecation warnings in interactive mode
	if (appMode === "interactive" && deprecationWarnings.length > 0) {
		await showDeprecationWarnings(deprecationWarnings);
	}

	const scopedModels = [...session.scopedModels];
	time("resolveModelScope");
	reportDiagnostics(runtime.diagnostics);
	if (runtime.diagnostics.some((diagnostic) => diagnostic.type === "error")) {
		process.exit(1);
	}
	time("createAgentSession");

	if (appMode !== "interactive" && !session.model) {
		console.error(chalk.red(formatNoModelsAvailableMessage()));
		process.exit(1);
	}

	const startupBenchmark = isTruthyEnvFlag(process.env.ETA_MU_STARTUP_BENCHMARK);
	if (startupBenchmark && appMode !== "interactive") {
		console.error(chalk.red("Error: ETA_MU_STARTUP_BENCHMARK only supports interactive mode"));
		process.exit(1);
	}

	if (appMode === "rpc") {
		printTimings();
		await runRpcMode(runtime);
	} else if (appMode === "interactive") {
		if (scopedModels.length > 0 && (parsed.verbose || !settingsManager.getQuietStartup())) {
			const modelList = scopedModels
				.map((sm) => {
					const thinkingStr = sm.thinkingLevel ? `:${sm.thinkingLevel}` : "";
					return `${sm.model.id}${thinkingStr}`;
				})
				.join(", ");
			console.log(chalk.dim(`Model scope: ${modelList} ${chalk.gray("(Ctrl+P to cycle)")}`));
		}

		const interactiveMode = new InteractiveMode(runtime, {
			migratedProviders,
			modelFallbackMessage,
			initialMessage,
			initialImages,
			initialAttachments,
			initialMessages: parsed.messages,
			verbose: parsed.verbose,
		});
		if (startupBenchmark) {
			await interactiveMode.init();
			time("interactiveMode.init");
			printTimings();
			interactiveMode.stop();
			stopThemeWatcher();
			if (process.stdout.writableLength > 0) {
				await new Promise<void>((resolve) => process.stdout.once("drain", resolve));
			}
			if (process.stderr.writableLength > 0) {
				await new Promise<void>((resolve) => process.stderr.once("drain", resolve));
			}
			return;
		}

		printTimings();
		await interactiveMode.run();
	} else {
		printTimings();
		const exitCode = await runPrintMode(runtime, {
			mode: toPrintOutputMode(appMode),
			messages: parsed.messages,
			initialMessage,
			initialImages,
			initialAttachments,
		});
		stopThemeWatcher();
		restoreStdout();
		if (exitCode !== 0) {
			process.exitCode = exitCode;
		}
		return;
	}
}

/**
 * Handle `eta-mu kanban <subcommand>` by delegating to the @open-hax/kanban-legacy CLI.
 *
 * Supports:
 *   eta-mu kanban serve [--tasks-dir <path>] [--port <port>] [--config <path>]
 *   eta-mu kanban board snapshot [--tasks-dir <path>] [--out <path>] [--config <path>]
 *   eta-mu kanban sync github [--tasks-dir <path>] [--repo <owner/repo>] [--dry-run] [--config <path>]
 *   eta-mu kanban list [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban find <uuid> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban search <query> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban update-status <uuid> <status> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban content <uuid> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban comment <uuid> <text> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban frontmatter <uuid> <key> <value> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban open <uuid> [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban count [--tasks-dir <path>] [--config <path>]
 *   eta-mu kanban help
 */
async function handleKanbanCommand(args: string[]): Promise<void> {
	const { existsSync } = await import("node:fs");
	const { resolve, dirname, join } = await import("node:path");
	const { createRequire } = await import("node:module");

	if (args[0] === "help" || args[0] === "--help" || args[0] === "-h" || args.length === 0) {
		printKanbanHelp();
		return;
	}

	// Resolve the kanban package CLI
	let kanbanCli: string;
	try {
		const require = createRequire(import.meta.url);
		const packageNames = ["@open-hax/kanban-legacy", "@openhax/kanban-legacy"];
		const kanbanPkgJson = packageNames
			.map((packageName) => {
				try {
					return require.resolve(`${packageName}/package.json`);
				} catch {
					return undefined;
				}
			})
			.find((candidate): candidate is string => typeof candidate === "string");
		if (!kanbanPkgJson) throw new Error("kanban package not found");
		kanbanCli = join(dirname(kanbanPkgJson), "dist", "cli.js");
	} catch {
		// Fallback: try relative path from coding-agent to kanban
		const fallback = resolve(import.meta.dirname, "../../kanban/dist/cli.js");
		if (existsSync(fallback)) {
			kanbanCli = fallback;
		} else {
			console.error(chalk.red("Could not find @open-hax/kanban-legacy or @openhax/kanban-legacy. Ensure it is installed."));
			process.exitCode = 1;
			return;
		}
	}

	// Handle built-in commands that need special treatment
	const subcommand = args[0];

	// Commands that map directly to the kanban CLI
	const passthroughCommands = ["serve", "board", "sync"];
	if (passthroughCommands.includes(subcommand)) {
		await runKanbanCli(kanbanCli, args);
		return;
	}

	// Built-in commands that load tasks and format output
	const tasksDirFlag = args.indexOf("--tasks-dir");
	const tasksDir = tasksDirFlag >= 0 ? args[tasksDirFlag + 1] : undefined;
	const configFlag = args.indexOf("--config");
	const configPath = configFlag >= 0 ? args[configFlag + 1] : undefined;
	const cliArgs = [] as string[];
	if (tasksDir) cliArgs.push("--tasks-dir", tasksDir);
	if (configPath) cliArgs.push("--config", configPath);

	const { loadTasks } = await import("../../kanban/dist/tasks.js");
	const { buildBoardSnapshot } = await import("../../kanban/dist/board.js");
	const { parseTaskContent } = await import("../../kanban/dist/content-parser.js");
	const { readFile } = await import("node:fs/promises");

	// Resolve tasks dir
	const { loadConfig, resolveConfigPathValue } = await import("../../kanban/dist/config.js");
	const loadedConfig = await loadConfig(configPath);
	const resolvedTasksDir = tasksDir
		? resolve(tasksDir)
		: resolveConfigPathValue(loadedConfig.config.tasksDir, loadedConfig.configDir)
		?? resolve(process.cwd(), "docs/agile/tasks");

	const load = async () => {
		try {
			return await loadTasks(resolvedTasksDir);
		} catch (e) {
			console.error(chalk.red(`Failed to load tasks from ${resolvedTasksDir}: ${e instanceof Error ? e.message : e}`));
			process.exitCode = 1;
			return null;
		}
	};

	if (subcommand === "list" || subcommand === "ls") {
		const tasks = await load();
		if (!tasks) return;
		const verbose = args.includes("--verbose") || args.includes("-v");
		for (const t of tasks) {
			if (verbose) {
				console.log(`[${t.priority}] ${t.status.padEnd(12)} ${t.uuid}`);
				console.log(`    ${t.title}`);
				console.log(`    ${t.labels.join(", ")}`);
				console.log();
			} else {
				console.log(`${t.uuid}  ${t.status.padEnd(12)}  ${t.priority}  ${t.title}`);
			}
		}
		console.log(`\n${tasks.length} tasks`);
		return;
	}

	if (subcommand === "count") {
		const tasks = await load();
		if (!tasks) return;
		const counts: Record<string, number> = {};
		for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
		const snapshot = buildBoardSnapshot(tasks);
		for (const col of snapshot.columns) {
			if (col.taskCount > 0) console.log(`  ${col.title.padEnd(14)} ${col.taskCount}`);
		}
		console.log(`  ${"total".padEnd(14)} ${tasks.length}`);
		return;
	}

	if (subcommand === "find") {
		const uuid = args[1];
		if (!uuid) { console.error(chalk.red("Usage: eta-mu kanban find <uuid>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const task = tasks.find((t) => t.uuid === uuid || t.slug === uuid || t.title.toLowerCase().includes(uuid.toLowerCase()));
		if (!task) { console.error(chalk.red(`Not found: ${uuid}`)); process.exitCode = 1; return; }
		console.log(JSON.stringify(task, null, 2));
		return;
	}

	if (subcommand === "search") {
		const query = args[1];
		if (!query) { console.error(chalk.red("Usage: eta-mu kanban search <query>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const q = query.toLowerCase();
		const matches = tasks.filter((t) =>
			[t.title, t.uuid, t.labels.join(" ")].join(" ").toLowerCase().includes(q)
		);
		for (const t of matches) console.log(`${t.uuid}  ${t.status.padEnd(12)}  ${t.priority}  ${t.title}`);
		console.log(`\n${matches.length} matches`);
		return;
	}

	if (subcommand === "update-status" || subcommand === "move") {
		const uuid = args[1];
		const status = args[2];
		if (!uuid || !status) { console.error(chalk.red("Usage: eta-mu kanban update-status <uuid> <status>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const task = tasks.find((t) => t.uuid === uuid || t.slug === uuid);
		if (!task) { console.error(chalk.red(`Not found: ${uuid}`)); process.exitCode = 1; return; }
		const { writeTaskStatus } = await import("../../kanban/dist/task-writeback.js");
		const updated = await writeTaskStatus(task, resolvedTasksDir, status);
		console.log(`${updated.uuid}  ${task.status} -> ${updated.status}`);
		return;
	}

	if (subcommand === "content") {
		const uuid = args[1];
		if (!uuid) { console.error(chalk.red("Usage: eta-mu kanban content <uuid>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const task = tasks.find((t) => t.uuid === uuid);
		if (!task) { console.error(chalk.red(`Not found: ${uuid}`)); process.exitCode = 1; return; }
		const raw = await readFile(task.sourcePath, "utf8");
		const parsed = parseTaskContent(raw);
		console.log(JSON.stringify(parsed, null, 2));
		return;
	}

	if (subcommand === "comment") {
		const uuid = args[1];
		const text = args.slice(2).join(" ");
		if (!uuid || !text) { console.error(chalk.red("Usage: eta-mu kanban comment <uuid> <text>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const task = tasks.find((t) => t.uuid === uuid);
		if (!task) { console.error(chalk.red(`Not found: ${uuid}`)); process.exitCode = 1; return; }
		const { appendComment } = await import("../../kanban/dist/content-parser.js");
		const updated = await appendComment(task.sourcePath, text);
		console.log("Comment added. Sections:");
		for (const s of updated.sections) console.log(`  [${s.type}] ${s.content.slice(0, 60)}...`);
		return;
	}

	if (subcommand === "frontmatter") {
		const uuid = args[1];
		const key = args[2];
		const value = args[3];
		if (!uuid || !key || value === undefined) { console.error(chalk.red("Usage: eta-mu kanban frontmatter <uuid> <key> <value>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const task = tasks.find((t) => t.uuid === uuid);
		if (!task) { console.error(chalk.red(`Not found: ${uuid}`)); process.exitCode = 1; return; }
		const { updateFrontmatterField } = await import("../../kanban/dist/content-parser.js");
		const parsed = await updateFrontmatterField(task.sourcePath, key, value);
		console.log(`Updated ${key}: ${JSON.stringify(parsed.frontmatter[key])}`);
		return;
	}

	if (subcommand === "open") {
		const uuid = args[1];
		if (!uuid) { console.error(chalk.red("Usage: eta-mu kanban open <uuid>")); process.exitCode = 1; return; }
		const tasks = await load();
		if (!tasks) return;
		const task = tasks.find((t) => t.uuid === uuid);
		if (!task) { console.error(chalk.red(`Not found: ${uuid}`)); process.exitCode = 1; return; }
		const { exec } = await import("node:child_process");
		const editor = process.env.EDITOR || process.env.VISUAL || "xdg-open";
		exec(`${editor} "${task.sourcePath}"`);
		console.log(`Opened ${task.sourcePath} in ${editor}`);
		return;
	}

	console.error(chalk.red(`Unknown kanban command: ${subcommand}`));
	console.error(chalk.dim(`Run '${APP_NAME} kanban help' for available commands.`));
	process.exitCode = 1;
}

function runKanbanCli(cliPath: string, args: string[]): Promise<void> {
	return new Promise(async (resolve, reject) => {
		const { spawn } = await import("node:child_process");
		const child = spawn(process.execPath, [cliPath, ...args], {
			stdio: "inherit",
			cwd: process.cwd(),
			env: process.env,
		});
		child.on("close", (code: number | null) => {
			process.exitCode = code ?? 0;
			resolve();
		});
		child.on("error", reject);
	});
}

function printKanbanHelp(): void {
	console.log(`${APP_NAME} kanban — agent-first task board
`);
	console.log(`USAGE`);
	console.log(`  ${APP_NAME} kanban <command> [options]
`);
	console.log(`COMMANDS`);
	console.log(`  serve                          Start the kanban web UI`);
	console.log(`  board snapshot                 Generate board snapshot JSON`);
	console.log(`  sync trello                    Sync tasks to Trello`);
	console.log(`  sync github                    Sync tasks to GitHub issues`);
	console.log(`  list                           List all tasks`);
	console.log(`  find <uuid>                    Find task by UUID`);
	console.log(`  search <query>                 Search tasks by title/content`);
	console.log(`  count                          Show task counts by column`);
	console.log(`  update-status <uuid> <status>  Move task to a new column`);
	console.log(`  content <uuid>                 Show parsed task content`);
	console.log(`  comment <uuid> <text>          Append a comment to a task`);
	console.log(`  frontmatter <uuid> <key> <val> Update a frontmatter field`);
	console.log(`  open <uuid>                    Open task file in $EDITOR`);
	console.log(`  help                           Show this help
`);
	console.log(`GLOBAL FLAGS`);
	console.log(`  --tasks-dir <path>             Task directory (default: from config)`);
	console.log(`  --config <path>                Path to kanban config file`);
	console.log(`  --port <port>                  Port for serve command (default: 8791)`);
	console.log(`  --host <host>                  Host for serve command (default: 127.0.0.1)
`);
	console.log(`EXAMPLES`);
	console.log(`  ${APP_NAME} kanban serve --tasks-dir ./specs/tasks`);
	console.log(`  ${APP_NAME} kanban list --tasks-dir ./specs/tasks`);
	console.log(`  ${APP_NAME} kanban find my-task-uuid`);
	console.log(`  ${APP_NAME} kanban update-status my-task-uuid in_progress`);
	console.log(`  ${APP_NAME} kanban content my-task-uuid`);
	console.log(`  ${APP_NAME} kanban comment my-task-uuid "Started work on this"`);
	console.log(`  ${APP_NAME} kanban frontmatter my-task-uuid priority P0`);
	console.log(`  ${APP_NAME} kanban open my-task-uuid`);
}
