import { afterEach, describe, expect, test } from "vitest";
import { detectInstallMethod, getSelfUpdateCommand, getUpdateInstruction } from "../src/config.js";

const execPathDescriptor = Object.getOwnPropertyDescriptor(process, "execPath");

function setExecPath(value: string): void {
	Object.defineProperty(process, "execPath", {
		value,
		configurable: true,
	});
}

afterEach(() => {
	if (execPathDescriptor) {
		Object.defineProperty(process, "execPath", execPathDescriptor);
	}
});

describe("detectInstallMethod", () => {
	test("detects pnpm from Windows .pnpm install paths", () => {
		setExecPath(
			"C:\\Users\\Admin\\Documents\\pnpm-repository\\global\\5\\.pnpm\\@mariozechner+pi-coding-agent@0.67.68\\node_modules\\@mariozechner\\pi-coding-agent\\dist\\cli.js",
		);

		expect(detectInstallMethod()).toBe("pnpm");
		expect(getUpdateInstruction("@open-hax/eta-mu-cli")).toBe(
			"Run: pnpm install -g @open-hax/eta-mu-cli",
		);
	});

	test("does not self-update unknown wrapper installs", () => {
		setExecPath("/usr/local/bin/node");

		expect(detectInstallMethod()).toBe("unknown");
		expect(getSelfUpdateCommand("@open-hax/eta-mu-cli")).toBeUndefined();
		expect(getUpdateInstruction("@open-hax/eta-mu-cli")).toBe(
			"Update @open-hax/eta-mu-cli using the package manager, wrapper, or source checkout that provides this installation.",
		);
	});
});
