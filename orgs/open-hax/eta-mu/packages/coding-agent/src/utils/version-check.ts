import { VERSION_CHECK_PACKAGE_NAME } from "../config.js";

const NPM_REGISTRY_URL = "https://registry.npmjs.org";
const DEFAULT_VERSION_CHECK_TIMEOUT_MS = 10000;

interface ParsedVersion {
	major: number;
	minor: number;
	patch: number;
	prerelease?: string;
}

function parsePackageVersion(version: string): ParsedVersion | undefined {
	const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/);
	if (!match) {
		return undefined;
	}
	return {
		major: Number.parseInt(match[1], 10),
		minor: Number.parseInt(match[2], 10),
		patch: Number.parseInt(match[3], 10),
		prerelease: match[4],
	};
}

export function comparePackageVersions(leftVersion: string, rightVersion: string): number | undefined {
	const left = parsePackageVersion(leftVersion);
	const right = parsePackageVersion(rightVersion);
	if (!left || !right) {
		return undefined;
	}

	if (left.major !== right.major) return left.major - right.major;
	if (left.minor !== right.minor) return left.minor - right.minor;
	if (left.patch !== right.patch) return left.patch - right.patch;
	if (left.prerelease === right.prerelease) return 0;
	if (!left.prerelease) return 1;
	if (!right.prerelease) return -1;
	return left.prerelease.localeCompare(right.prerelease);
}

export function isNewerPackageVersion(candidateVersion: string, currentVersion: string): boolean {
	const comparison = comparePackageVersions(candidateVersion, currentVersion);
	if (comparison !== undefined) {
		return comparison > 0;
	}
	return candidateVersion.trim() !== currentVersion.trim();
}

export async function getLatestEtaMuVersion(
	currentVersion: string,
	options: { packageName?: string; timeoutMs?: number } = {},
): Promise<string | undefined> {
	if (process.env.ETA_MU_SKIP_VERSION_CHECK || process.env.ETA_MU_OFFLINE) return undefined;

	const packageName = options.packageName ?? VERSION_CHECK_PACKAGE_NAME;
	const encodedPackageName = packageName.startsWith("@") ? packageName.replace("/", "%2f") : packageName;
	const response = await fetch(`${NPM_REGISTRY_URL}/${encodedPackageName}/latest`, {
		headers: {
			accept: "application/json",
		},
		signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_VERSION_CHECK_TIMEOUT_MS),
	});
	if (!response.ok) return undefined;

	const data = (await response.json()) as { version?: unknown };
	return typeof data.version === "string" && data.version.trim() ? data.version.trim() : undefined;
}

export const getLatestPiVersion = getLatestEtaMuVersion;

export async function checkForNewEtaMuVersion(currentVersion: string): Promise<string | undefined> {
	try {
		const latestVersion = await getLatestEtaMuVersion(currentVersion);
		if (latestVersion && isNewerPackageVersion(latestVersion, currentVersion)) {
			return latestVersion;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

export const checkForNewPiVersion = checkForNewEtaMuVersion;
