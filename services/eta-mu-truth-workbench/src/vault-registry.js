export const vaultRegistry = {
  proxx: {
    id: 'proxx',
    displayName: 'Proxx',
    repo: 'open-hax/proxx',
    flowKind: 'staging-main',
    trackedReviewActors: ['coderabbitai', 'app/coderabbitai'],
    promotionPrTitle: 'Staging',
    branches: {
      staging: 'staging',
      main: 'main',
    },
    workflows: {
      prToStaging: 'staging-pr',
      deployStaging: 'deploy-staging',
      stagingE2e: 'staging-live-e2e',
      prToMainGate: 'main-pr-gate',
      reviewGate: 'coderabbit-review-gate',
      etaMu: 'eta-mu',
    },
  },
  voxx: {
    id: 'voxx',
    displayName: 'Voxx',
    repo: 'open-hax/voxx',
    flowKind: 'main-only',
    trackedReviewActors: ['coderabbitai', 'app/coderabbitai'],
    branches: {
      main: 'main',
    },
    workflows: {
      mainPipeline: 'voxx-main',
    },
  },
};

export const listVaults = () => Object.values(vaultRegistry);
export const getVault = (vaultId) => vaultRegistry[vaultId] ?? null;
