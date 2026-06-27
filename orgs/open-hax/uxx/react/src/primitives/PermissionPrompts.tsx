/**
 * PermissionPrompts Component
 *
 * Implements the permission-prompts.edn contract.
 * A panel for handling permission requests and input prompts from an AI agent or system,
 * with options for one-time approval, persistent approval, and rejection.
 */

import { tokens } from '@open-hax/uxx/tokens';
import { PermissionCard } from './PermissionCard.js';
import { PromptCard } from './PromptCard.js';
import type {
  PermissionRequest,
  InputPrompt,
  PermissionResponse,
} from './PermissionPrompts.types.js';

export type { PermissionRequest, InputPrompt, PermissionResponse } from './PermissionPrompts.types.js';

export interface PermissionPromptsProps {
  /** Pending permission requests */
  permissions?: PermissionRequest[];
  /** Pending input prompts */
  prompts?: InputPrompt[];
  /** Callback for permission response */
  onPermissionResponse: (id: string, response: PermissionResponse) => void;
  /** Callback for input prompt response */
  onPromptResponse: (id: string, response: string) => void;
  /** Auto-focus input fields */
  autoFocusInput?: boolean;
  /** Show permission metadata */
  showMetadata?: boolean;
  /** Group prompts by session */
  groupBySession?: boolean;
}

/**
 * Panel for handling permission requests and input prompts.
 *
 * @example
 * ```tsx
 * <PermissionPrompts
 *   permissions={[{ id: 'perm-1', title: 'Read file', metadata: { path: '/src/core.ts' } }]}
 *   prompts={[{ id: 'prompt-1', title: 'Input', body: { prompt: 'Name?' } }]}
 *   onPermissionResponse={(id, resp) => handlePerm(id, resp)}
 *   onPromptResponse={(id, resp) => handlePrompt(id, resp)}
 * />
 * ```
 */
export function PermissionPrompts({
  permissions = [],
  prompts = [],
  onPermissionResponse,
  onPromptResponse,
  autoFocusInput = true,
  showMetadata = true,
  groupBySession = false,
}: PermissionPromptsProps) {
  const pendingCount = permissions.length + prompts.length;
  const hasPending = pendingCount > 0;

  return (
    <div
      data-component="permission-prompts"
      data-pending-count={pendingCount}
      role="region"
      aria-label="Pending requests"
      aria-live="polite"
      style={{
        padding: `${tokens.spacing[3]}px`,
        backgroundColor: tokens.colors.background.surface,
        minHeight: '100%',
      }}
    >
      <div
        style={{
          marginBottom: `${tokens.spacing[3]}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: tokens.typography.bodySm.fontSize,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: tokens.colors.text.muted,
          }}
        >
          Pending Requests
        </h3>
        {hasPending && (
          <span
            style={{
              fontSize: tokens.typography.bodySm.fontSize,
              color: tokens.colors.accent.green,
              padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
              background: tokens.colors.alpha.green._12,
              borderRadius: `${tokens.spacing[0.5]}px`,
            }}
          >
            {pendingCount}
          </span>
        )}
      </div>

      {!hasPending && (
        <div
          data-testid="prompts-empty"
          style={{
            padding: `${tokens.spacing[4]}px`,
            textAlign: 'center',
            color: tokens.colors.text.muted,
            fontSize: tokens.typography.bodySm.fontSize,
          }}
        >
          No pending requests
        </div>
      )}

      {permissions.length > 0 && (
        <div className="permissions-section">
          {permissions.map((permission) => (
            <PermissionCard
              key={permission.id}
              permission={permission}
              onResponse={onPermissionResponse}
              showMetadata={showMetadata}
            />
          ))}
        </div>
      )}

      {prompts.length > 0 && (
        <div className="prompts-section">
          {prompts.map((prompt, idx) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onResponse={onPromptResponse}
              autoFocus={autoFocusInput && idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PermissionPrompts;
