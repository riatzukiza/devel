import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { normalizeText } from "./text";
import type { ResumeDocument, WorkbenchReport } from "./types";

const execFileAsync = promisify(execFile);

const readPdfText = async (filePath: string): Promise<string> => {
  const { stdout } = await execFileAsync("pdftotext", ["-layout", filePath, "-"]);
  return stdout;
};

export const loadDocument = async (filePath: string, kind: "resume" | "job-description"): Promise<ResumeDocument> => {
  const ext = path.extname(filePath).toLowerCase();
  const text = ext === ".pdf"
    ? await readPdfText(filePath)
    : await fs.readFile(filePath, "utf8");
  const normalizedText = normalizeText(text);
  return {
    path: filePath,
    kind,
    text,
    normalizedText,
    wordCount: normalizedText.split(/\s+/).filter(Boolean).length
  };
};

export const writeReportFiles = async (root: string, slug: string, report: WorkbenchReport): Promise<{ readonly jsonPath: string; readonly markdownPath: string }> => {
  await fs.mkdir(root, { recursive: true });
  const jsonPath = path.join(root, `${slug}.json`);
  const markdownPath = path.join(root, `${slug}.md`);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

  const markdown = [
    `# Resume ML Workbench Report`,
    ``,
    `Generated: ${report.generatedAt}`,
    ``,
    `## Resumes`,
    ...report.resumes.map((entry) => `- ${entry}`),
    ``,
    `## Job Descriptions`,
    ...report.jobDescriptions.map((entry) => `- ${entry}`),
    ``,
    `## Pair Scores`,
    ...report.pairs.flatMap((pair) => [
      `### ${path.basename(pair.resumePath)} vs ${path.basename(pair.jobDescriptionPath)}`,
      `- Hybrid score: ${pair.breakdown.hybridScore.toFixed(3)}`,
      `- Keyword coverage: ${pair.breakdown.keywordCoverage.toFixed(3)}`,
      `- Phrase coverage: ${pair.breakdown.phraseCoverage.toFixed(3)}`,
      `- Lexical similarity: ${pair.breakdown.lexicalSimilarity.toFixed(3)}`,
      `- Section signal: ${pair.breakdown.sectionSignal.toFixed(3)}`,
      `- Recommendations:`,
      ...pair.recommendations.map((item) => `  - ${item}`),
      ``
    ]),
    `## Notes`,
    ...report.notes.map((entry) => `- ${entry}`),
    ``
  ].join("\n");

  await fs.writeFile(markdownPath, markdown);
  return { jsonPath, markdownPath };
};
