import fs from "node:fs/promises";

export const appendReceipt = async (line: string): Promise<void> => {
  await fs.appendFile("receipts.log", `${line}\n`, "utf8");
};

export const receiptLine = (input: {
  readonly ts: string;
  readonly kind: string;
  readonly origin: string;
  readonly owner: string;
  readonly dod: string;
  readonly pi: string;
  readonly host: string;
  readonly manifest: string;
  readonly refs: string;
  readonly note: string;
  readonly tests?: string;
}): string => {
  const base = [
    `${input.ts}`,
    `kind=${input.kind}`,
    `origin=${input.origin}`,
    `owner=${input.owner}`,
    `dod=${input.dod}`,
    `pi=${input.pi}`,
    `host=${input.host}`,
    `manifest=${input.manifest}`,
    `refs=${input.refs}`,
  ];
  if (input.tests) {
    base.push(`tests=${input.tests}`);
  }
  base.push(`note=${input.note}`);
  return base.join(" | ");
};
