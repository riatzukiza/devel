#!/usr/bin/env node
/**
 * CLI entry point for the refactored coding agent.
 * Uses main.ts with AgentSession and new mode modules.
 *
 * Test with: npx tsx src/cli-new.ts [args...]
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";
import { APP_NAME } from "./config.js";
import { main } from "./main.js";

process.title = APP_NAME;
process.env.ETA_MU_CLI = "true";
process.env.ETA_MU_CODING_AGENT = "true";
process.env.PI_CODING_AGENT = "true";
process.emitWarning = (() => {}) as typeof process.emitWarning;

type EtaMuBuiltinsPackageJson = {
	pi?: {
		extensions?: unknown;
	};
};

function getDefaultBuiltInTools(packageJson: EtaMuBuiltinsPackageJson): string[] {
	const extensions = packageJson.pi?.extensions;
	if (!Array.isArray(extensions) || !extensions.every((extension) => typeof extension === "string")) {
		throw new Error("@open-hax/eta-mu-extensions package.json must declare pi.extensions as string[]");
	}
	return extensions;
}

function injectDefaultBuiltInTools(): void {
	if (process.env.ETA_MU_NO_DEFAULT_EXTENSIONS === "1") return;
	if (process.argv.includes("--no-extensions") || process.argv.includes("-ne")) return;

	const require = createRequire(import.meta.url);
	const builtinsPackageJson = require.resolve("@open-hax/eta-mu-extensions/package.json");
	const builtinsPackage = require(builtinsPackageJson) as EtaMuBuiltinsPackageJson;
	const builtinsRoot = dirname(builtinsPackageJson);
	const extensionArgs = getDefaultBuiltInTools(builtinsPackage).flatMap((extensionPath) => [
		"--extension",
		join(builtinsRoot, extensionPath),
	]);
	process.argv.splice(2, 0, ...extensionArgs);
}

injectDefaultBuiltInTools();

// bodyTimeout/headersTimeout default to 300s in undici; long local-LLM stalls
// (e.g. vLLM buffering a large tool call) exceed that and abort the SSE stream
// with UND_ERR_BODY_TIMEOUT. Disable both — provider SDKs enforce their own
// AbortController-based deadlines via retry.provider.timeoutMs.
setGlobalDispatcher(new EnvHttpProxyAgent({ bodyTimeout: 0, headersTimeout: 0 }));

main(process.argv.slice(2));
