import type { ApplyArgs } from "./types";

// Conservative default selection: pick a known 1-page, fnord-free resume.
// Users can always override with --resume.
export const pickDefaultResumePdf = (args: ApplyArgs): string => {
  const role = args.role.toLowerCase();

  if (role.includes("devsecops") || role.includes("platform") || role.includes("security")) {
    return "resume/aaron-beavers-devsecops-ai-1p.pdf";
  }
  if (role.includes("ml") || role.includes("machine learning") || role.includes("llm") || role.includes("ai")) {
    return "resume/aaron-beavers-ml-oss-1p.pdf";
  }
  if (role.includes("rails") || role.includes("ruby") || role.includes("react") || role.includes("full-stack") || role.includes("full stack")) {
    return "resume/aaron-beavers-ichi-costanoa-v1-1p.pdf";
  }

  return "resume/aaron-beavers-resume-ats.pdf";
};
