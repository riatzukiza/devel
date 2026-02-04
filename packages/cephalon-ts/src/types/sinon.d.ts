declare module "sinon" {
  export interface SinonSandbox {
    restore(): void;
  }

  export interface SinonStub {
    resolves(value?: unknown): SinonStub;
    returns(value?: unknown): SinonStub;
  }

  export function createSandbox(): SinonSandbox;
  export function stub(): SinonStub;
}
