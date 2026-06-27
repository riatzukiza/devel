import type { ApplyArgs } from "./types";

export const parseArgs = (argv: readonly string[]): ApplyArgs => {
  const args: Partial<ApplyArgs> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--company") {
      args.company = next ?? "";
      index += 1;
      continue;
    }
    if (token === "--role") {
      args.role = next ?? "";
      index += 1;
      continue;
    }
    if (token === "--job-url") {
      args.jobUrl = next;
      index += 1;
      continue;
    }
    if (token === "--job-file") {
      args.jobFile = next;
      index += 1;
      continue;
    }
    if (token === "--company-url") {
      args.companyUrl = next;
      index += 1;
      continue;
    }
    if (token === "--resume") {
      args.resume = next;
      index += 1;
      continue;
    }
    if (token === "--date") {
      args.date = next;
      index += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
  }

  if (!args.company || !args.role) {
    throw new Error(
      "Usage: pnpm resume:apply -- --company <name> --role <role> (--job-url <url> | --job-file <path>) [--company-url <url>] [--resume <pdf>] [--date yyyy-mm-dd] [--dry-run]"
    );
  }
  if (!args.jobUrl && !args.jobFile) {
    throw new Error("Must supply --job-url or --job-file");
  }

  return args as ApplyArgs;
};
