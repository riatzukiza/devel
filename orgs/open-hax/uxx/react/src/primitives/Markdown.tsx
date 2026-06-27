import React, { useCallback, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { tokens, type ThemeColors, type ThemePreference, withAlpha } from '@open-hax/uxx/tokens';
import { CodeBlock } from './CodeBlock.js';
import { useResolvedTheme } from '../theme.js';

export interface MarkdownProps {
  content: string;
  variant?: 'default' | 'preview' | 'compact' | 'full';
  theme?: ThemePreference;
  lineNumbers?: boolean;
  copyButton?: boolean;
  linkTarget?: '_self' | '_blank';
  sanitize?: boolean;
  maxLines?: number;
  onLinkClick?: (href: string, e: React.MouseEvent) => void;
  onHeadingClick?: (id: string, text: string) => void;
  className?: string;
}

const HEADING_SIZES: Record<number, number> = {
  1: 32,
  2: 24,
  3: 20,
  4: 18,
  5: 16,
  6: 14,
};

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingRendererProps = HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode };
type CodeElementProps = HTMLAttributes<HTMLElement> & { children?: ReactNode; className?: string };

type PreRendererProps = HTMLAttributes<HTMLPreElement> & {
  children?: React.ReactElement<CodeElementProps> | ReactNode;
};

function flattenText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(flattenText).join('');
  }

  if (React.isValidElement<{ children?: ReactNode }>(node)) {
    return flattenText(node.props.children);
  }

  return '';
}

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function getCodeLanguage(className?: string): string | undefined {
  const match = className?.match(/language-([^\s]+)/);
  return match?.[1];
}

function createHeadingRenderer(
  level: number,
  themeColors: ThemeColors,
  onHeadingClick?: (id: string, text: string) => void,
) {
  return ({ children, ...props }: HeadingRendererProps) => {
    const Tag = `h${level}` as HeadingTag;
    const text = flattenText(children);
    const id = slugifyHeading(text);

    return (
      <Tag
        {...props}
        id={id}
        style={{
          marginTop: level === 1 ? 0 : 24,
          marginBottom: 16,
          fontSize: HEADING_SIZES[level],
          fontWeight: level === 1 ? 700 : 600,
          color: themeColors.text.default,
          cursor: onHeadingClick ? 'pointer' : undefined,
        }}
        onClick={onHeadingClick ? () => onHeadingClick(id, text) : undefined}
      >
        {children}
      </Tag>
    );
  };
}

export const Markdown: React.FC<MarkdownProps> = ({
  content,
  variant = 'default',
  theme = 'dark',
  lineNumbers = true,
  copyButton = true,
  linkTarget = '_blank',
  sanitize = true,
  maxLines,
  onLinkClick,
  onHeadingClick,
  className,
}) => {
  const resolvedTheme = useResolvedTheme(theme);
  const themeColors = resolvedTheme.colors;

  const handleLinkClick = useCallback(
    (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onLinkClick) {
        e.preventDefault();
        onLinkClick(href, e);
      }
    },
    [onLinkClick],
  );

  const rehypePlugins = useMemo(() => (sanitize ? [] : [rehypeRaw]), [sanitize]);

  const components = useMemo<Components>(
    () => ({
      h1: createHeadingRenderer(1, themeColors, onHeadingClick),
      h2: createHeadingRenderer(2, themeColors, onHeadingClick),
      h3: createHeadingRenderer(3, themeColors, onHeadingClick),
      h4: createHeadingRenderer(4, themeColors, onHeadingClick),
      h5: createHeadingRenderer(5, themeColors, onHeadingClick),
      h6: createHeadingRenderer(6, themeColors, onHeadingClick),
      p: ({ children, ...props }) => (
        <p
          {...props}
          style={{
            marginTop: 0,
            marginBottom: 16,
            lineHeight: 1.7,
            color: themeColors.text.default,
          }}
        >
          {children}
        </p>
      ),
      a: ({ href, children, ...props }) => (
        <a
          {...props}
          href={href}
          style={{
            color: themeColors.accent.cyan,
            textDecoration: 'none',
          }}
          target={linkTarget}
          rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={href && onLinkClick ? (e) => handleLinkClick(href, e) : undefined}
        >
          {children}
        </a>
      ),
      code: ({ className: codeClassName, children, ...props }: CodeElementProps) => (
        <code
          {...props}
          className={codeClassName}
          style={{
            background: withAlpha(themeColors.text.default, 0.05),
            padding: '2px 6px',
            borderRadius: tokens.radius.xs,
            fontFamily: tokens.fontFamily.mono,
            fontSize: '0.9em',
          }}
        >
          {children}
        </code>
      ),
      pre: ({ children }: PreRendererProps) => {
        if (React.isValidElement<CodeElementProps>(children)) {
          const code = String(children.props.children ?? '').replace(/\n$/, '');

          return (
            <CodeBlock
              code={code}
              language={getCodeLanguage(children.props.className)}
              lineNumbers={lineNumbers}
              showCopy={copyButton}
              maxLines={maxLines}
              theme={theme}
              showLanguage
            />
          );
        }

        return <pre>{children}</pre>;
      },
      blockquote: ({ children, ...props }) => (
        <blockquote
          {...props}
          style={{
            margin: '16px 0',
            padding: '8px 16px',
            borderLeft: `4px solid ${themeColors.accent.cyan}`,
            background: withAlpha(themeColors.accent.cyan, 0.05),
            color: themeColors.text.muted,
          }}
        >
          {children}
        </blockquote>
      ),
      ul: ({ children, ...props }) => (
        <ul
          {...props}
          style={{
            marginTop: 0,
            marginBottom: 16,
            paddingLeft: 24,
            lineHeight: 1.7,
            color: themeColors.text.default,
          }}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          {...props}
          style={{
            marginTop: 0,
            marginBottom: 16,
            paddingLeft: 24,
            lineHeight: 1.7,
            color: themeColors.text.default,
          }}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li {...props} style={{ marginBottom: 4 }}>
          {children}
        </li>
      ),
      hr: (props) => (
        <hr
          {...props}
          style={{
            border: 'none',
            height: 1,
            background: themeColors.border.default,
            margin: '24px 0',
          }}
        />
      ),
      img: ({ src, alt, ...props }) => (
        <img
          {...props}
          src={src || ''}
          alt={alt || ''}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: tokens.radius.md,
          }}
        />
      ),
      table: ({ children, ...props }) => (
        <div
          style={{
            overflowX: 'auto',
            margin: '16px 0',
          }}
        >
          <table
            {...props}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: variant === 'compact' ? 13 : 14,
            }}
          >
            {children}
          </table>
        </div>
      ),
      th: ({ children, ...props }) => (
        <th
          {...props}
          style={{
            padding: '8px 12px',
            textAlign: 'left',
            borderBottom: `2px solid ${themeColors.border.default}`,
            color: themeColors.text.default,
            fontWeight: 600,
          }}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          {...props}
          style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${themeColors.border.subtle}`,
            color: themeColors.text.default,
          }}
        >
          {children}
        </td>
      ),
    }),
    [copyButton, handleLinkClick, lineNumbers, linkTarget, maxLines, onHeadingClick, onLinkClick, theme, themeColors, variant],
  );

  return (
    <div
      className={className}
      data-component="markdown"
      data-variant={variant}
      role="article"
      aria-label="Markdown content"
      style={{
        fontFamily: 'inherit',
        fontSize: variant === 'compact' ? 13 : 14,
        lineHeight: 1.6,
        maxWidth: variant === 'full' ? '100%' : '65ch',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        skipHtml={sanitize}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
