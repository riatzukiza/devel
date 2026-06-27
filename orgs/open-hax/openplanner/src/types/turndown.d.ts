declare module "turndown" {
  export default class TurndownService {
    constructor(options?: Record<string, unknown>);
    use(plugin: unknown): void;
    remove(selectors: string[]): void;
    turndown(input: string): string;
  }
}

declare module "turndown-plugin-gfm" {
  export const gfm: unknown;
}
