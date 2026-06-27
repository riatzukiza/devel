/**
 * EntityCard Composition
 *
 * Implements the entity-card-composition.spec.md contract.
 * A composition of primitives for displaying entity information in card form.
 */

import { type ReactNode, type CSSProperties, type MouseEvent } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { Badge, type BadgeVariant } from '../primitives/Badge.js';
import { Button } from '../primitives/Button.js';
import { KeyValueSection, type KeyValueEntry } from '../primitives/KeyValueSection.js';

// Types derived from contract
export type EntityCardVariant = 'default' | 'outlined' | 'elevated' | 'gradient';

export interface EntityCardStatus {
  /** Status value to display */
  value: string;
  /** Badge variant for status */
  variant?: BadgeVariant;
}

export interface EntityCardImage {
  /** Image source URL */
  src: string;
  /** Alt text */
  alt?: string;
  /** Image size */
  size?: 'sm' | 'md' | 'lg';
}

export interface EntityCardAction {
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon */
  icon?: ReactNode;
}

export interface EntityCardMetadata {
  /** Metadata label */
  label: string;
  /** Metadata value */
  value: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
}

export interface EntityCardProps {
  /** Entity identifier */
  id: string;
  /** Entity display name */
  name: string;
  /** Entity type/subtype label */
  type?: string;
  /** Entity status for badge */
  status?: EntityCardStatus;
  /** Metadata key-value pairs */
  metadata?: EntityCardMetadata[];
  /** Optional image/avatar */
  image?: EntityCardImage;
  /** Optional tags/labels */
  tags?: string[];
  /** Primary action button */
  primaryAction?: EntityCardAction;
  /** Secondary actions */
  secondaryActions?: EntityCardAction[];
  /** Whether card is interactive (clickable) */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Card variant */
  variant?: EntityCardVariant;
  /** Custom gradient for gradient variant */
  gradient?: string;
  /** Whether to show dividers between sections */
  dividers?: boolean;
  /** Custom header content (replaces default) */
  header?: ReactNode;
  /** Custom footer content (replaces actions) */
  footer?: ReactNode;
  /** Custom class name */
  className?: string;
}

// Variant styles
const variantStyles: Record<EntityCardVariant, CSSProperties> = {
  default: {
    backgroundColor: tokens.colors.background.surface,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[1.5]}px`,
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[1.5]}px`,
  },
  elevated: {
    backgroundColor: tokens.colors.background.elevated,
    border: 'none',
    borderRadius: `${tokens.spacing[1.5]}px`,
    boxShadow: tokens.shadow.md,
  },
  gradient: {
    backgroundColor: tokens.colors.background.elevated,
    border: 'none',
    borderRadius: `${tokens.spacing[1.5]}px`,
    boxShadow: tokens.shadow.md,
  },
};

// Base styles
const containerStyles: CSSProperties = {
  width: '100%',
  fontFamily: tokens.fontFamily.sans,
  overflow: 'hidden',
};

const headerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
};

const imageContainerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: `${tokens.spacing[2]}px 0`,
};

const metadataContainerStyles: CSSProperties = {
  padding: `0 ${tokens.spacing[4]}px`,
};

const tagsContainerStyles: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${tokens.spacing[1]}px`,
  padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
};

const footerStyles: CSSProperties = {
  display: 'flex',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
};

const dividerStyles: CSSProperties = {
  borderTop: `1px solid ${tokens.colors.border.default}`,
  marginTop: `${tokens.spacing[2]}px`,
  marginBottom: `${tokens.spacing[2]}px`,
};

/**
 * EntityCard - composition for displaying entity information.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EntityCard
 *   id={agent.id}
 *   name={agent.name}
 *   type="Agent"
 *   status={{ value: 'Alive', variant: 'success' }}
 *   metadata={[
 *     { label: 'Position', value: '(0, 0)' },
 *     { label: 'Role', value: 'Worker' },
 *   ]}
 * />
 *
 * // Interactive with actions
 * <EntityCard
 *   id={issue.id}
 *   name={`Issue #${issue.number}`}
 *   type={issue.title}
 *   status={{ value: issue.state, variant: 'open' }}
 *   tags={issue.labels}
 *   interactive
 *   onClick={() => navigate(`/issues/${issue.id}`)}
 *   primaryAction={{ label: 'Open', onClick: () => openIssue(issue.id) }}
 * />
 * ```
 */
export function EntityCard({
  id,
  name,
  type,
  status,
  metadata,
  image,
  tags,
  primaryAction,
  secondaryActions,
  interactive = false,
  onClick,
  variant = 'default',
  gradient,
  dividers = true,
  header,
  footer,
  className,
}: EntityCardProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleActionClick = (
    e: MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    e.stopPropagation();
    action();
  };

  // Compute container styles
  const computedContainerStyles: CSSProperties = {
    ...containerStyles,
    ...variantStyles[variant],
    ...(gradient ? { background: gradient } : {}),
    ...(interactive ? { cursor: 'pointer' } : {}),
  };

  // Convert metadata to KeyValueEntry format
  const keyValueEntries: KeyValueEntry[] | undefined = metadata?.map(m => ({
    label: m.label,
    value: m.value,
    icon: m.icon,
  }));

  // Image size mapping
  const imageSizes: Record<'sm' | 'md' | 'lg', number> = {
    sm: 48,
    md: 64,
    lg: 96,
  };

  return (
    <div
      data-component="entity-card"
      data-variant={variant}
      data-id={id}
      data-interactive={interactive || undefined}
      style={computedContainerStyles}
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {header ?? (
        <div style={headerStyles}>
          <div>
            <strong style={{ fontSize: tokens.fontSize.base, fontWeight: tokens.fontWeight.semibold }}>
              {name}
            </strong>
            {type && (
              <span style={{
                fontSize: tokens.fontSize.sm,
                color: tokens.colors.text.muted,
                marginLeft: `${tokens.spacing[2]}px`,
              }}>
                {type}
              </span>
            )}
          </div>
          {status && (
            <Badge variant={status.variant ?? 'default'}>
              {status.value}
            </Badge>
          )}
        </div>
      )}

      {header && !image && !metadata && !tags ? null : null}

      {image && (
        <div style={imageContainerStyles}>
          <img
            src={image.src}
            alt={image.alt ?? name}
            style={{
              width: imageSizes[image.size ?? 'md'],
              height: imageSizes[image.size ?? 'md'],
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {dividers && (image || metadata) && !header && (
        <div style={{ margin: `0 ${tokens.spacing[4]}px`, ...dividerStyles }} />
      )}

      {keyValueEntries && keyValueEntries.length > 0 && (
        <div style={metadataContainerStyles}>
          <KeyValueSection entries={keyValueEntries} dividers={false} />
        </div>
      )}

      {dividers && tags && tags.length > 0 && (metadata || image) && (
        <div style={{ margin: `0 ${tokens.spacing[4]}px`, ...dividerStyles }} />
      )}

      {tags && tags.length > 0 && (
        <div style={tagsContainerStyles}>
          {tags.map(tag => (
            <Badge key={tag} size="sm" variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {footer ?? ((primaryAction || secondaryActions) && (
        <>
          {dividers && (tags || metadata || image || header) && (
            <div style={{ margin: `0 ${tokens.spacing[4]}px`, ...dividerStyles }} />
          )}
          <div style={footerStyles}>
            {primaryAction && (
              <Button
                variant="primary"
                onClick={(e) => handleActionClick(e, primaryAction.onClick)}
              >
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            )}
            {secondaryActions?.map((action, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                onClick={(e) => handleActionClick(e, action.onClick)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </>
      ))}
    </div>
  );
}

export default EntityCard;
