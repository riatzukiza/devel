import { z } from 'zod';

export const LATEST_MANIFEST_VERSION = '0.1.0';

export const repoCategorySchema = z.enum([
  'core',
  'support',
  'test',
  'sandbox',
  'local'
]);

export type RepoCategory = z.infer<typeof repoCategorySchema>;

export const hookEventSchema = z.enum([
  'post-clone',
  'post-sync',
  'pre-commit',
  'pre-push'
]);

export type HookEvent = z.infer<typeof hookEventSchema>;

export const repoHookSchema = z.object({
  name: z.string().min(1),
  when: hookEventSchema,
  run: z.string().min(1),
  shell: z.enum(['bash', 'sh', 'pwsh', 'cmd']).default('bash'),
  timeoutSec: z.number().int().positive().max(3600).optional(),
  continueOnError: z.boolean().default(false)
});

export type RepoHook = z.infer<typeof repoHookSchema>;

export const authStrategySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ssh'),
    identityFile: z.string().optional(),
    useAgent: z.boolean().default(true)
  }),
  z.object({
    type: z.literal('https'),
    tokenEnv: z.string().optional()
  }),
  z.object({
    type: z.literal('github-app'),
    appIdEnv: z.string().default('GITHUB_APP_ID'),
    installationIdEnv: z.string().default('GITHUB_INSTALLATION_ID'),
    privateKeyPath: z.string().optional()
  }),
  z.object({
    type: z.literal('local'),
    relativePath: z.string()
  })
]);

export type AuthStrategy = z.infer<typeof authStrategySchema>;

const manifestOverrideSchema = z.object({
  category: repoCategorySchema.optional(),
  branch: z.string().optional(),
  auth: authStrategySchema.optional(),
  hooks: z.array(repoHookSchema).optional()
});

export type ManifestOverride = z.infer<typeof manifestOverrideSchema>;

export const repositorySchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  url: z.string().min(1),
  depth: z.number().int().nonnegative(),
  category: repoCategorySchema.default('core'),
  auth: authStrategySchema,
  branch: z.string().optional(),
  tag: z.string().optional(),
  pinnedCommit: z.string().optional(),
  sparseCheckout: z.array(z.string().min(1)).nonempty().optional(),
  hooks: z.array(repoHookSchema).optional(),
  dependsOn: z.array(z.string().min(1)).optional(),
  profiles: z.array(z.string().min(1)).optional(),
  metadata: z
    .record(
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string())
      ])
    )
    .optional()
});

export type RepoManifestEntry = z.infer<typeof repositorySchema>;

export const profileSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  include: z.array(z.string().min(1)).nonempty(),
  exclude: z.array(z.string().min(1)).optional(),
  overrides: z.record(manifestOverrideSchema).optional()
});

export type ManifestProfile = z.infer<typeof profileSchema>;

export const generatorSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1)
});

export type ManifestGenerator = z.infer<typeof generatorSchema>;

export const manifestSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().min(1),
  root: z.string().min(1),
  generator: generatorSchema,
  repositories: z.array(repositorySchema).nonempty(),
  profiles: z.array(profileSchema).default([])
});

export type NestedSubmoduleManifest = z.infer<typeof manifestSchema>;

export const manifestFileSchema = manifestSchema.extend({
  version: z.literal(LATEST_MANIFEST_VERSION)
});

export type LatestNestedSubmoduleManifest = z.infer<typeof manifestFileSchema>;
