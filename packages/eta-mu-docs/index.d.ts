export type EtaMuMount = {
  id: string;
  root: string;
  include?: string[];
  exclude?: string[];
};

export type EtaMuMountsConfig = {
  record?: string;
  version?: string | number;
  generated_at?: string;
  mounts: EtaMuMount[];
};

export type EtaMuHeading = { level: number; title: string };

export type EtaMuLink =
  | {
      kind: 'wikilink';
      target: string;
      target_key: string;
      alias: string;
      line: number;
    }
  | {
      kind: 'markdown';
      url: string;
      text: string;
      line: number;
    };

export type EtaMuDocsIndexRow = {
  record: 'ημ.docs-index.v1';
  parser_version: string;
  extracted_at: string;
  entity_id: string;
  mount_id: string;
  source_rel_path: string;
  bytes: number;
  mtime_ns: number;
  mtime_utc: string;
  content_sha256: string;
  title: string;
  headings: EtaMuHeading[];
  tags: string[];
  links: EtaMuLink[];
};

export type EtaMuDocsBacklinksRow = {
  record: 'ημ.docs-backlinks.v1';
  generated_at: string;
  target_key: string;
  sources: Array<{
    kind: 'wikilink';
    src_entity_id: string;
    src_rel_path: string;
    target: string;
    target_key: string;
    line: number;
  }>;
};

export function loadEtaMuMounts(opts: {
  repoRoot: string;
  mountsPath: string;
}): EtaMuMountsConfig;

export function parseEtaMuMarkdown(opts: {
  relPath: string;
  text: string;
}): {
  uuid: string;
  title: string;
  headings: EtaMuHeading[];
  tags: string[];
  links: EtaMuLink[];
};

export function readJsonl(filePath: string): any[];
export function writeJsonl(filePath: string, rows: any[]): void;

export function indexEtaMuDocs(opts: {
  repoRoot: string;
  mountsPath: string;
  indexPath: string;
  backlinksPath: string;
  parserVersion?: string;
}): Promise<{
  indexedFiles: number;
  indexPath: string;
  backlinksPath: string;
}>;
