import { afterEach, describe, expect, it, vi } from "vitest";
import { VERSION } from "../src/config.js";
import { restoreStdout } from "../src/core/output-guard.js";
import { main } from "../src/main.js";

type ExitError = Error & { exitCode?: string | number | null };

function mockProcessExit() {
	return vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
		const error = new Error(`process.exit(${String(code)})`) as ExitError;
		error.exitCode = code;
		throw error;
	}) as typeof process.exit);
}

describe("version command CLJS parity", () => {
	afterEach(() => {
		restoreStdout();
		vi.restoreAllMocks();
	});

	it("routes --version through the compiled CLJS surface command result", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const exitSpy = mockProcessExit();

		await expect(main(["--version"])).rejects.toMatchObject({ exitCode: 0 });

		expect(logSpy).toHaveBeenCalledWith(VERSION);
		expect(exitSpy).toHaveBeenCalledWith(0);
	});
});
