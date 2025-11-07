import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Provider } from "@opencode-ai/sdk";
import {
	CodexClient,
	CodexClientBuilder,
	type AskForApproval,
	type SandboxPolicy,
	type ReasoningEffort,
	type ReasoningSummary,
} from "@flo-ai/codex-ts-sdk";

const PROVIDER_ID = "openai-codex-sdk";
const DEFAULT_MODEL = "gpt-5-codex";

interface CodexSdkProviderOptions {
	codexHome?: string;
	nativeModulePath?: string;
	defaultModel?: string;
	defaultEffort?: ReasoningEffort;
	defaultSummary?: ReasoningSummary;
	approvalPolicy?: AskForApproval;
	sandboxPolicy?: SandboxPolicy;
	skipVersionCheck?: boolean;
}

class CodexSdkBridge {
	private clientPromise: Promise<CodexClient> | undefined;
	private conversationId: string | undefined;

	constructor(private options: CodexSdkProviderOptions = {}) {}

	updateOptions(next: CodexSdkProviderOptions): void {
		this.options = { ...this.options, ...next };
		this.clientPromise = undefined;
	}

	private async ensureClient(): Promise<CodexClient> {
		if (!this.clientPromise) {
			this.clientPromise = this.createClient();
		}
		return this.clientPromise;
	}

	private async createClient(): Promise<CodexClient> {
		const builder = new CodexClientBuilder();
		if (this.options.codexHome) builder.withCodexHome(this.options.codexHome);
		if (this.options.nativeModulePath) builder.withNativeModulePath(this.options.nativeModulePath);
		if (this.options.defaultModel) builder.withDefaultModel(this.options.defaultModel);
		if (this.options.defaultEffort) builder.withDefaultEffort(this.options.defaultEffort);
		if (this.options.defaultSummary) builder.withDefaultSummary(this.options.defaultSummary);
		if (this.options.approvalPolicy) builder.withApprovalPolicy(this.options.approvalPolicy);
		if (this.options.sandboxPolicy) builder.withSandboxPolicy(this.options.sandboxPolicy);
		if (this.options.skipVersionCheck) {
			builder.withConfig({ skipVersionCheck: true });
		}

		const client = builder.build();
		await client.connect();
		this.conversationId = await client.createConversation({
			overrides: {
				model: this.options.defaultModel ?? DEFAULT_MODEL,
			},
		});
		return client;
	}

	private normalizeUrl(input: Request | string | URL): string {
		if (typeof input === "string") return input;
		if (input instanceof URL) return input.toString();
		return input.url;
	}

	async fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> {
		const url = this.normalizeUrl(input);
		await this.ensureClient();

		const body = typeof init?.body === "string" ? init?.body : undefined;

		return new Response(
			JSON.stringify(
				{
					error: "codex-sdk bridge not implemented yet",
					url,
					conversationId: this.conversationId,
					note:
						"The SDK client is initialized; streaming conversion of /v1/responses payloads still needs to be wired.",
					request: body ? safeParse(body) : undefined,
				},
				null,
				2,
			),
			{
				status: 501,
				headers: { "content-type": "application/json" },
			},
		);
	}
}

function safeParse(payload: string): unknown {
	try {
		return JSON.parse(payload);
	} catch {
		return { raw: payload };
	}
}

function extractOptions(provider: Provider | undefined): CodexSdkProviderOptions {
	const raw = (provider?.options ?? {}) as Record<string, unknown>;
	const options: CodexSdkProviderOptions = {};
	if (typeof raw.codexHome === "string") options.codexHome = raw.codexHome;
	if (typeof raw.nativeModulePath === "string") options.nativeModulePath = raw.nativeModulePath;
	if (typeof raw.defaultModel === "string") options.defaultModel = raw.defaultModel;
	if (typeof raw.approvalPolicy === "string") options.approvalPolicy = raw.approvalPolicy as AskForApproval;
	if (typeof raw.skipVersionCheck === "boolean") options.skipVersionCheck = raw.skipVersionCheck;
	if (typeof raw.defaultEffort === "string") options.defaultEffort = raw.defaultEffort as ReasoningEffort;
	if (typeof raw.defaultSummary === "string") options.defaultSummary = raw.defaultSummary as ReasoningSummary;
	if (raw.sandboxPolicy && typeof raw.sandboxPolicy === "object") {
		options.sandboxPolicy = raw.sandboxPolicy as SandboxPolicy;
	}
	return options;
}

export const OpenAICodexSdkPlugin: Plugin = async (_context: PluginInput) => {
	const bridge = new CodexSdkBridge();

	return {
		auth: {
			provider: PROVIDER_ID,
			async loader(_getAuth, provider) {
				const options = extractOptions(provider);
				bridge.updateOptions(options);
				return {
					apiKey: "codex-sdk-local",
					baseURL: "https://codex-sdk.local",
					fetch: (input: Request | string | URL, init?: RequestInit) => bridge.fetch(input, init),
				};
			},
			methods: [
				{
					type: "api" as const,
					label: "Codex SDK (local)",
				},
			],
		},
	};
};

export default OpenAICodexSdkPlugin;
