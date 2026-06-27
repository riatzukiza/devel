import type { CSSProperties } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import type { PermissionRequest, PermissionResponse } from './PermissionPrompts.types.js';

export interface PermissionCardProps {
  permission: PermissionRequest;
  onResponse: (id: string, response: PermissionResponse) => void;
  showMetadata?: boolean;
  style?: CSSProperties;
  className?: string;
}

const rootStyles: CSSProperties = {
  padding: `${tokens.spacing[3]}px`,
  border: `1px solid ${tokens.colors.border.default}`,
  borderRadius: `${tokens.spacing[1]}px`,
  background: tokens.colors.background.default,
  marginBottom: `${tokens.spacing[2]}px`,
};

const titleStyles: CSSProperties = {
  fontSize: tokens.typography.body.fontSize,
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.text.default,
  marginBottom: `${tokens.spacing[2]}px`,
};

const mutedStyles: CSSProperties = {
  fontSize: tokens.typography.bodySm.fontSize,
  color: tokens.colors.text.muted,
  marginBottom: `${tokens.spacing[2]}px`,
};

const metadataStyles: CSSProperties = {
  fontSize: tokens.typography.bodySm.fontSize,
  color: tokens.colors.text.secondary,
  marginBottom: `${tokens.spacing[2]}px`,
  fontFamily: tokens.fontFamily.mono,
};

const actionsStyles: CSSProperties = {
  display: 'flex',
  gap: `${tokens.spacing[2]}px`,
  flexWrap: 'wrap',
};

function renderMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return null;
  if (typeof metadata.path === 'string') return <span>Path: {metadata.path}</span>;
  if (typeof metadata.command === 'string') return <span>Command: {metadata.command}</span>;
  return <span>{JSON.stringify(metadata)}</span>;
}

export function PermissionCard({ permission, onResponse, showMetadata = true, style, className }: PermissionCardProps) {
  const defaultResponse = permission.defaultResponse || 'once';

  return (
    <div
      data-component="permission-card"
      data-testid="permission-card"
      data-permission-id={permission.id}
      style={{ ...rootStyles, ...style }}
      className={className}
    >
      <div style={titleStyles}>{permission.title || 'Permission Request'}</div>

      {showMetadata && permission.metadata && <div style={metadataStyles}>{renderMetadata(permission.metadata)}</div>}

      {permission.sessionId && <div style={mutedStyles}>Session: {permission.sessionId}</div>}

      {permission.timeoutMs && <div style={mutedStyles}>Expires in {Math.floor(permission.timeoutMs / 1000)}s</div>}

      <div style={actionsStyles}>
        <button
          type="button"
          data-testid="permission-btn-once"
          onClick={() => onResponse(permission.id, 'once')}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: defaultResponse === 'once' ? tokens.colors.background.elevated : tokens.colors.background.default,
            color: tokens.colors.text.default,
            cursor: 'pointer',
          }}
        >
          Allow Once
        </button>
        <button
          type="button"
          data-testid="permission-btn-always"
          onClick={() => onResponse(permission.id, 'always')}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.accent.green}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: defaultResponse === 'always' ? tokens.colors.accent.green : 'transparent',
            color: defaultResponse === 'always' ? tokens.colors.background.default : tokens.colors.accent.green,
            cursor: 'pointer',
          }}
        >
          Always Allow
        </button>
        <button
          type="button"
          data-testid="permission-btn-reject"
          onClick={() => onResponse(permission.id, 'reject')}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.accent.red}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: defaultResponse === 'reject' ? tokens.colors.accent.red : 'transparent',
            color: defaultResponse === 'reject' ? tokens.colors.background.default : tokens.colors.accent.red,
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default PermissionCard;
