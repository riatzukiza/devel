import path from "node:path";
import process from "node:process";
import { loadDocument, writeReportFiles } from "./io";
import { recommendImprovements, scorePair } from "./scoring";
import type { PairReport, WorkbenchReport } from "./types";

interface ParsedArgs {
  readonly resumes: readonly string[];
  readonly jobs: readonly string[];
  readonly outputDir: string;
  readonly slug: string;
}

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const resumes: string[] = [];
  const jobs: string[] = [];
  let outputDir = "resume/analysis";
  let slug = `resume-ml-workbench-${new Date().toISOString().slice(0, 10)}`;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--resume") {
      resumes.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (token === "--job") {
      jobs.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (token === "--output-dir") {
      outputDir = argv[index + 1] ?? outputDir;
      index += 1;
      continue;
    }
    if (token === "--slug") {
      slug = argv[index + 1] ?? slug;
      index += 1;
    }
  }

  if (resumes.length === 0 || jobs.length === 0) {
    throw new Error("Usage: tsx src/resume-workbench/cli.ts --resume <file>... --job <file>... [--output-dir dir] [--slug name]");
  }

  return { resumes, jobs, outputDir, slug };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const resumes = await Promise.all(args.resumes.map((entry) => loadDocument(entry, "resume")));
  const jobs = await Promise.all(args.jobs.map((entry) => loadDocument(entry, "job-description")));

  const pairs: PairReport[] = [];
  for (const resume of resumes) {
    for (const job of jobs) {
      const breakdown = scorePair(resume, job);
      pairs.push({
        resumePath: resume.path,
        jobDescriptionPath: job.path,
        breakdown,
        recommendations: recommendImprovements(breakdown)
      });
    }
  }

  const report: WorkbenchReport = {
    generatedAt: new Date().toISOString(),
    resumes: resumes.map((entry) => entry.path),
    jobDescriptions: jobs.map((entry) => entry.path),
    pairs,
    notes: [
      "Hybrid score currently combines lexical token coverage, phrase coverage, cosine similarity over bag-of-words frequencies, and ATS-section signal.",
      "Dense embedding mode is a planned extension; local Ollama was unavailable during this implementation pass.",
      "Use parser ensemble outputs alongside this report; do not over-trust a single score."
    ]
  };

  const paths = await writeReportFiles(args.outputDir, args.slug, report);
  process.stdout.write(JSON.stringify({ ...paths, pairCount: report.pairs.length }, null, 2));
  process.stdout.write("\n");
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
