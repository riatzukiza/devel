export interface ApplyArgs {
  readonly company: string;
  readonly role: string;
  readonly jobUrl?: string;
  readonly jobFile?: string;
  readonly companyUrl?: string;
  readonly resume?: string;
  readonly date?: string;
  readonly dryRun?: boolean;
}

export interface ApplicationBundlePaths {
  readonly rootDir: string;
  readonly sourcesDir: string;
  readonly extractedDir: string;
  readonly synthesisDir: string;
  readonly verificationDir: string;
}

export interface RequirementsExtract {
  readonly company: string;
  readonly role: string;
  readonly jobUrl?: string;
  readonly capturedAt: string;
  readonly bullets: readonly string[];
}
