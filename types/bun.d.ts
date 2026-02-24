declare module "bun" {
  export type BuildOptions = {
    entrypoints: string[];
    target: string;
    outdir?: string;
    outfile?: string;
    format?: "cjs" | "esm";
    minify?: boolean;
    sourcemap?: boolean | "external" | "inline";
    external?: string[];
  };

  export type BuildOutput = {
    outputs: Array<{ path: string }>;
  };

  export function build(options: BuildOptions): Promise<BuildOutput>;
}
