import { Agent } from "@open-hax/eta-mu-agent-core";
import { getModel } from "@open-hax/eta-mu-ai";
import { afterEach, describe, expect, it } from "vitest";
import { type AgentSessionEvent, AgentSession } from "../src/core/agent-session.js";
import { AuthStorage } from "../src/core/auth-storage.js";
import { ModelRegistry } from "../src/core/model-registry.js";
import { SessionManager } from "../src/core/session-manager.js";
import { SettingsManager } from "../src/core/settings-manager.js";
import type { ExtensionError } from "../src/core/extensions/types.js";
import { createTestResourceLoader } from "./utilities.js";

const model = getModel("anthropic", "claude-sonnet-4-5")!;

type AgentSessionWithPrivateEmit = AgentSession & {
	_emit: (event: AgentSessionEvent) => void;
};

function createSession() {
	const authStorage = AuthStorage.inMemory();
	authStorage.setRuntimeApiKey("anthropic", "test-key");

	return new AgentSession({
		agent: new Agent({
			getApiKey: () => "test-key",
			initialState: {
				model,
				systemPrompt: "You are a helpful assistant.",
				tools: [],
			},
		}),
		sessionManager: SessionManager.inMemory(),
		settingsManager: SettingsManager.inMemory(),
		cwd: process.cwd(),
		modelRegistry: ModelRegistry.inMemory(authStorage),
		resourceLoader: createTestResourceLoader(),
	});
}

describe("AgentSession event listeners", () => {
	const unhandledReasons: unknown[] = [];
	const onUnhandledRejection = (reason: unknown) => {
		unhandledReasons.push(reason);
	};

	afterEach(() => {
		process.off("unhandledRejection", onUnhandledRejection);
		unhandledReasons.length = 0;
	});

	it("reports async listener failures without leaking unhandled rejections", async () => {
		const session = createSession() as AgentSessionWithPrivateEmit;
		const errors: ExtensionError[] = [];
		await session.bindExtensions({ onError: (error) => errors.push(error) });

		process.on("unhandledRejection", onUnhandledRejection);

		session.subscribe(async () => {
			await Promise.resolve();
			throw new Error("async listener boom");
		});

		session._emit({ type: "queue_update", steering: [], followUp: [] });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({
			extensionPath: "<session-listener>",
			event: "queue_update",
			error: "async listener boom",
		});
		expect(unhandledReasons).toEqual([]);
	});

	it("reports synchronous listener failures and continues notifying later listeners", async () => {
		const session = createSession() as AgentSessionWithPrivateEmit;
		const errors: ExtensionError[] = [];
		const seen: string[] = [];
		await session.bindExtensions({ onError: (error) => errors.push(error) });

		session.subscribe(() => {
			seen.push("first");
			throw new Error("sync listener boom");
		});
		session.subscribe(() => {
			seen.push("second");
		});

		session._emit({ type: "queue_update", steering: [], followUp: [] });

		expect(seen).toEqual(["first", "second"]);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({
			extensionPath: "<session-listener>",
			event: "queue_update",
			error: "sync listener boom",
		});
	});
});
