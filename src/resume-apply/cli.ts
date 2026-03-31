import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

import { loadDocument, writeReportFiles } from "../resume-workbench/io";
import { recommendImprovements, scorePair } from "../resume-workbench/scoring";

import { parseArgs } from "./args";
import { ensureDir, writeJson, writeText, copyIfExists, fileExists } from "./io";
import { appendReceipt, receiptLine } from "./receipts";
import { pickDefaultResumePdf } from "./selection";
import { slugify, stripHtmlToText } from "./text";
import { buildRequirements, diffTopMissingTokens, keywordCounts } from "./extract";

const nowIso = (): string => new Date().toISOString();
const today = (): string => new Date().toISOString().slice(0, 10);

const fetchUrl = async (url: string): Promise<{ readonly url: string; readonly contentType: string | null; readonly body: string; }> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "resume-apply (worker-side; evidence-capture)",
        "accept": "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8"
      }
    });
    const body = await response.text();
    return {
      url,
      contentType: response.headers.get("content-type"),
      body
    };
  } finally {
    clearTimeout(timeout);
  }
};

const tryRunPdfTools = (pdfPath: string): { readonly pages: number | null; readonly text: string } => {
  let pages: number | null = null;
  try {
    const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
    const match = info.split("\n").find((line) => line.startsWith("Pages:"));
    if (match) {
      pages = Number(match.split(":")[1]?.trim() ?? "NaN");
    }
  } catch {
    // ignore
  }

  let text = "";
  try {
    text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8" });
  } catch {
    // ignore
  }
  return { pages: Number.isFinite(pages) ? pages : null, text };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const doWrites = args.dryRun !== true;
  const date = args.date ?? today();

  const companySlug = slugify(args.company);
  const roleSlug = slugify(args.role);
  const bundleRoot = path.join("resume", "applications", date, companySlug, roleSlug);
  const sourcesDir = path.join(bundleRoot, "sources");
  const extractedDir = path.join(bundleRoot, "extracted");
  const synthesisDir = path.join(bundleRoot, "synthesis");
  const verificationDir = path.join(bundleRoot, "verification");

  const host = os.hostname();
  if (doWrites) {
    await appendReceipt(receiptLine({
      ts: nowIso(),
      kind: "observation",
      origin: "devel",
      owner: "err",
      dod: "artifact",
      pi: "pi",
      host,
      manifest: "-",
      refs: "resume-apply",
      note: `begin bundle: ${bundleRoot}`
    }));
  }

  if (doWrites) {
    await ensureDir(sourcesDir);
    await ensureDir(extractedDir);
    await ensureDir(synthesisDir);
    await ensureDir(verificationDir);
  }

  // --- acquire job text
  let jobRaw = "";
  let jobProvenance = "";
  if (args.jobUrl) {
    const fetched = await fetchUrl(args.jobUrl);
    jobProvenance = `url: ${fetched.url}\ncontent-type: ${fetched.contentType ?? ""}\ncapturedAt: ${nowIso()}\n`;
    const isHtml = (fetched.contentType ?? "").includes("text/html") || fetched.body.trim().startsWith("<");
    jobRaw = isHtml ? stripHtmlToText(fetched.body) : fetched.body;
    if (doWrites) {
      await writeText(path.join(sourcesDir, "job-posting.url.txt"), `${args.jobUrl}\n`);
      await writeText(path.join(sourcesDir, "job-posting.provenance.txt"), jobProvenance);
      await writeText(path.join(sourcesDir, "job-posting.raw" + (isHtml ? ".html" : ".txt")), fetched.body);
      await writeText(path.join(sourcesDir, "job-posting.txt"), jobRaw);
    }
  } else if (args.jobFile) {
    jobProvenance = `file: ${args.jobFile}\ncapturedAt: ${nowIso()}\n`;
    jobRaw = await (await import("node:fs/promises")).readFile(args.jobFile, "utf8");
    if (doWrites) {
      await writeText(path.join(sourcesDir, "job-posting.file.txt"), `${args.jobFile}\n`);
      await writeText(path.join(sourcesDir, "job-posting.provenance.txt"), jobProvenance);
      await writeText(path.join(sourcesDir, "job-posting.txt"), jobRaw);
    }
  }

  // --- optional company about
  if (args.companyUrl) {
    const fetched = await fetchUrl(args.companyUrl);
    const isHtml = (fetched.contentType ?? "").includes("text/html") || fetched.body.trim().startsWith("<");
    const companyText = isHtml ? stripHtmlToText(fetched.body) : fetched.body;
    if (doWrites) {
      await writeText(path.join(sourcesDir, "company.url.txt"), `${args.companyUrl}\n`);
      await writeText(path.join(sourcesDir, "company.raw" + (isHtml ? ".html" : ".txt")), fetched.body);
      await writeText(path.join(sourcesDir, "company.txt"), companyText);
    }
  }

  // --- extract requirements/keywords
  const capturedAt = nowIso();
  const requirements = buildRequirements({ company: args.company, role: args.role, jobUrl: args.jobUrl, capturedAt, jobText: jobRaw });
  const keywords = keywordCounts(jobRaw);
  if (doWrites) {
    await writeJson(path.join(extractedDir, "requirements.json"), requirements);
    await writeJson(path.join(extractedDir, "keywords.json"), keywords);
  }

  // --- resume selection + copy
  const selectedResumePdf = args.resume ?? pickDefaultResumePdf(args);
  const selectedStem = selectedResumePdf.endsWith(".pdf")
    ? selectedResumePdf.slice(0, -".pdf".length)
    : selectedResumePdf;

  if (doWrites) {
    await writeText(path.join(synthesisDir, "resume-selected.txt"), `${selectedResumePdf}\n`);
    await copyIfExists(selectedResumePdf, path.join(synthesisDir, path.basename(selectedResumePdf)));
    await copyIfExists(`${selectedStem}.md`, path.join(synthesisDir, path.basename(`${selectedStem}.md`)));
    await copyIfExists(`${selectedStem}.tex`, path.join(synthesisDir, path.basename(`${selectedStem}.tex`)));
  }

  // --- truth-binding: generate a quiz file for missing JD tokens
  const resumeForQuizPath = path.join(synthesisDir, path.basename(selectedResumePdf));
  const resumePdfExists = await fileExists(resumeForQuizPath);
  const resumeText = resumePdfExists ? tryRunPdfTools(resumeForQuizPath).text : "";
  const missing = diffTopMissingTokens({ resumeText, jobText: jobRaw, limit: 20 });

  const quizMd = [
    `# QUIZ (truth-binding)`,
    ``,
    `These prompts exist because the job posting contains terms not found in the selected resume text.`,
    `Answer only with safe abstractions; do not violate NDAs or government constraints.`,
    ``,
    `## Top missing job-posting tokens`,
    ...missing.map((entry) => `- **${entry.token}** (job count ~${entry.jobCount}) → Do you have relevant experience? If yes, what is a safe, high-level example?`),
    ``,
    `## Boundary reminders`,
    `- If something is sensitive: say “cannot share details; can describe high-level responsibilities and outcomes.”`,
    `- If you don't have it: say so; we won't add it.`,
    ``,
  ].join("\n");
  if (doWrites) {
    await writeText(path.join(synthesisDir, "QUIZ.md"), quizMd);
  }

  // --- cover letter draft (placeholder, evidence-first)
  const detectedProjects = ["Open Hax", "Shibboleth", "Mythloom", "Battlebussy", "Gates of Aker"]
    .filter((needle) => resumeText.includes(needle));
  const coverDraft = [
    `# Cover Letter (Draft) — ${args.company} — ${args.role}`,
    ``,
    `To the hiring team,`,
    ``,
    `I'm applying for ${args.role} at ${args.company}. Below is a first draft intended for *manual editing* before you send it.`,
    ``,
    `## Evidence-backed highlights (from selected resume text)`,
    ...(detectedProjects.length === 0
      ? [`- (No project names auto-detected from the selected PDF text; review resume manually.)`]
      : detectedProjects.map((p) => `- ${p} (present in selected resume PDF text)`)),
    ``,
    `## Why this role`,
    `- (Fill: 2–3 sentences that reference the job posting sources stored in this bundle.)`,
    ``,
    `## What I would do in the first 30–90 days`,
    `- (Fill: bullets mapped to responsibilities/requirements extracted in extracted/requirements.json.)`,
    ``,
    `---`,
    `Aaron Beavers`,
    `West Des Moines, IA 50265 | 515-388-0539 | foamy125@gmail.com`,
    `GitHub: https://github.com/riatzukiza`,
    ``
  ].join("\n");
  if (doWrites) {
    await writeText(path.join(synthesisDir, "cover-letter.draft.md"), coverDraft);
  }

  // --- verification: parsers + workbench scoring
  if (doWrites && resumePdfExists) {
    const structure = tryRunPdfTools(resumeForQuizPath);
    await writeJson(path.join(verificationDir, "pdf-structure.json"), {
      file: path.basename(resumeForQuizPath),
      pages: structure.pages,
      textExtractable: structure.text.length > 0,
      containsFnord: structure.text.includes("fnord:"),
      containsMythloom: structure.text.includes("Mythloom"),
    });

    // pyresume + sereena-parser (best effort)
    const pyBin = path.join("tmp", "resume-ats-audit-venv", "bin", "python");
    const sereenaBin = path.join("tmp", "resume-ats-audit-venv", "bin", "sereena-parser");

    const pyScriptPath = path.join(verificationDir, "pyresume-run.py");
    const pyScript = [
      "import json",
      "import sys",
      "from pyresume import ResumeParser",
      "parser = ResumeParser()",
      "data = parser.parse(sys.argv[1])",
      "md = getattr(data, 'extraction_metadata', None)",
      "out = {",
      "  'contact': {",
      "    'name': getattr(data.contact_info, 'name', None),",
      "    'email': getattr(data.contact_info, 'email', None),",
      "    'phone': getattr(data.contact_info, 'phone', None),",
      "    'github': getattr(data.contact_info, 'github', None),",
      "  },",
      "  'counts': {",
      "    'education': len(getattr(data, 'education', []) or []),",
      "    'experience': len(getattr(data, 'experience', []) or []),",
      "    'skills': len(getattr(data, 'skills', []) or []),",
      "    'certifications': len(getattr(data, 'certifications', []) or []),",
      "    'projects': len(getattr(data, 'projects', []) or []),",
      "  },",
      "  'sections_found': md.get('sections_found') if isinstance(md, dict) else None,",
      "  'overall_confidence': md.get('overall_confidence') if isinstance(md, dict) else None,",
      "}",
      "print(json.dumps(out, indent=2))",
    ].join("\n");
    await writeText(pyScriptPath, pyScript);

    try {
      const pyresumeOut = execFileSync(pyBin, [pyScriptPath, resumeForQuizPath], { encoding: "utf8" });
      await writeText(path.join(verificationDir, "parser-pyresume.json"), `${pyresumeOut}\n`);
    } catch (error) {
      await writeText(path.join(verificationDir, "parser-pyresume.error.txt"), String(error));
    }

    try {
      execFileSync(sereenaBin, [resumeForQuizPath, "-o", path.join(verificationDir, "parser-sereena.json")], { encoding: "utf8" });
    } catch (error) {
      await writeText(path.join(verificationDir, "parser-sereena.error.txt"), String(error));
    }

    // workbench scoring (lexical-only)
    try {
      const resumeDoc = await loadDocument(resumeForQuizPath, "resume");
      const jobPath = path.join(sourcesDir, "job-posting.txt");
      const jobDoc = await loadDocument(jobPath, "job-description");
      const breakdown = scorePair(resumeDoc, jobDoc);
      const report = {
        generatedAt: nowIso(),
        resumes: [resumeDoc.path],
        jobDescriptions: [jobDoc.path],
        pairs: [
          {
            resumePath: resumeDoc.path,
            jobDescriptionPath: jobDoc.path,
            breakdown,
            recommendations: recommendImprovements(breakdown)
          }
        ],
        notes: [
          "This is a worker-side alignment score. Do not use it for ranking other candidates.",
          "Dense embeddings are not enabled here; this is lexical+structure only.",
          "Use parser ensemble outputs alongside this report; do not over-trust a single score."
        ]
      };
      await writeReportFiles(verificationDir, "workbench", report);
    } catch (error) {
      await writeText(path.join(verificationDir, "workbench.error.txt"), String(error));
    }
  }

  // Per-bundle receipts summary.
  if (doWrites) {
    await writeText(path.join(bundleRoot, "RECEIPTS.md"), [
      `# Application bundle receipts`,
      ``,
      `- bundle: ${bundleRoot}`,
      `- capturedAt: ${capturedAt}`,
      `- company: ${args.company}`,
      `- role: ${args.role}`,
      `- jobUrl: ${args.jobUrl ?? ""}`,
      `- selectedResume: ${selectedResumePdf}`,
      ``,
      `See repo root receipts.log for the global receipt river.`
    ].join("\n"));
  }

  if (doWrites) {
    await appendReceipt(receiptLine({
      ts: nowIso(),
      kind: "artifact",
      origin: "devel",
      owner: "err",
      dod: "artifact",
      pi: "pi",
      host,
      manifest: "-",
      refs: "resume-apply",
      note: `completed bundle: ${bundleRoot}`
    }));
  }

  process.stdout.write(JSON.stringify({ bundleRoot }, null, 2));
  process.stdout.write("\n");
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
