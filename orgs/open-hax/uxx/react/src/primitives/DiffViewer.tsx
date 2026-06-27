import React, { useMemo, useCallback } from 'react';
import { tokens, type ThemePreference, withAlpha } from '@open-hax/uxx/tokens';
import { useResolvedTheme } from '../theme.js';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  oldLine?: number;
  newLine?: number;
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface DiffViewerProps {
  original: string;
  modified: string;
  filename?: string;
  language?: string;
  mode?: 'unified' | 'split';
  theme?: ThemePreference;
  lineNumbers?: boolean;
  showStats?: boolean;
  showFilename?: boolean;
  foldThreshold?: number;
  highlightLines?: {
    original?: number[];
    modified?: number[];
  };
  onLineClick?: (line: DiffLine, side: 'original' | 'modified') => void;
  onHunkClick?: (hunk: DiffHunk) => void;
  className?: string;
}

// Simple diff algorithm (Myers-like)
function computeDiff(original: string, modified: string): DiffLine[] {
  const oldLines = original.split('\n');
  const newLines = modified.split('\n');
  const result: DiffLine[] = [];
  
  const lcs = longestCommonSubsequence(oldLines, newLines);
  
  let oldIndex = 0;
  let newIndex = 0;
  let lcsIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (lcsIndex < lcs.length && oldIndex < oldLines.length && newIndex < newLines.length && oldLines[oldIndex] === newLines[newIndex]) {
      result.push({
        type: 'unchanged',
        content: oldLines[oldIndex],
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
      lcsIndex++;
    } else if (oldIndex < oldLines.length && (lcsIndex >= lcs.length || oldLines[oldIndex] !== lcs[lcsIndex])) {
      result.push({
        type: 'removed',
        content: oldLines[oldIndex],
        oldLine: oldIndex + 1,
      });
      oldIndex++;
    } else if (newIndex < newLines.length && (lcsIndex >= lcs.length || newLines[newIndex] !== lcs[lcsIndex])) {
      result.push({
        type: 'added',
        content: newLines[newIndex],
        newLine: newIndex + 1,
      });
      newIndex++;
    } else {
      // Skip LCS match
      if (oldIndex < oldLines.length) {
        result.push({
          type: 'unchanged',
          content: oldLines[oldIndex],
          oldLine: oldIndex + 1,
          newLine: newIndex + 1,
        });
        oldIndex++;
        newIndex++;
      }
      lcsIndex++;
    }
  }
  
  return result;
}

function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

function groupIntoHunks(lines: DiffLine[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let unchangedCount = 0;
  
  lines.forEach((line, index) => {
    if (line.type === 'unchanged') {
      unchangedCount++;
      if (currentHunk) {
        currentHunk.lines.push(line);
      }
    } else {
      unchangedCount = 0;
      if (!currentHunk) {
        currentHunk = {
          oldStart: line.oldLine || 1,
          oldLines: 0,
          newStart: line.newLine || 1,
          newLines: 0,
          header: `@@ -${line.oldLine || 1},1 +${line.newLine || 1},1 @@`,
          lines: [],
        };
      }
      currentHunk.lines.push(line);
      if (line.type === 'removed') {
        currentHunk.oldLines++;
      } else {
        currentHunk.newLines++;
      }
    }
    
    // End hunk after enough unchanged lines
    if (unchangedCount >= 3 && currentHunk) {
      hunks.push(currentHunk);
      currentHunk = null;
    }
  });
  
  if (currentHunk) {
    hunks.push(currentHunk);
  }
  
  return hunks.length > 0 ? hunks : [{ oldStart: 1, oldLines: lines.length, newStart: 1, newLines: lines.length, header: '@@ -1,1 +1,1 @@', lines }];
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  filename,
  language,
  mode = 'unified',
  theme = 'dark',
  lineNumbers = true,
  showStats = true,
  showFilename = true,
  foldThreshold = 100,
  highlightLines,
  onLineClick,
  onHunkClick,
  className,
}) => {
  const diff = useMemo(() => computeDiff(original, modified), [original, modified]);
  const hunks = useMemo(() => groupIntoHunks(diff), [diff]);
  const resolvedTheme = useResolvedTheme(theme);
  const themeColors = resolvedTheme.colors;
  
  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diff.forEach((line) => {
      if (line.type === 'added') additions++;
      if (line.type === 'removed') deletions++;
    });
    return { additions, deletions };
  }, [diff]);
  
  const handleLineClick = useCallback(
    (line: DiffLine, side: 'original' | 'modified') => {
      onLineClick?.(line, side);
    },
    [onLineClick]
  );
  
  const handleHunkClick = useCallback(
    (hunk: DiffHunk) => {
      onHunkClick?.(hunk);
    },
    [onHunkClick]
  );
  
  const renderUnifiedLine = (line: DiffLine, index: number) => {
    const isHighlighted =
      (line.type === 'removed' && highlightLines?.original?.includes(line.oldLine || 0)) ||
      (line.type === 'added' && highlightLines?.modified?.includes(line.newLine || 0));
    
    return (
      <div
        key={index}
        data-line-type={line.type}
        onClick={() => handleLineClick(line, line.oldLine ? 'original' : 'modified')}
        style={{
          display: 'flex',
          fontFamily: tokens.fontFamily.mono,
          fontSize: 13,
          lineHeight: 1.5,
          background: isHighlighted
            ? withAlpha(themeColors.text.default, 0.05)
            : line.type === 'added'
            ? themeColors.badge.info.bg
            : line.type === 'removed'
            ? themeColors.badge.error.bg
            : 'transparent',
          cursor: onLineClick ? 'pointer' : 'default',
        }}
      >
        {/* Line type indicator */}
        <div
          style={{
            width: 20,
            textAlign: 'center',
            color: line.type === 'added' ? themeColors.accent.cyan : line.type === 'removed' ? themeColors.accent.red : 'transparent',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
        </div>
        
        {/* Old line number */}
        {lineNumbers && (
          <div
            style={{
              width: 40,
              textAlign: 'right',
              paddingRight: 12,
              color: themeColors.text.subtle,
              userSelect: 'none',
              opacity: 0.5,
              flexShrink: 0,
            }}
          >
            {line.oldLine || ''}
          </div>
        )}
        
        {/* New line number */}
        {lineNumbers && (
          <div
            style={{
              width: 40,
              textAlign: 'right',
              paddingRight: 12,
              color: themeColors.text.subtle,
              userSelect: 'none',
              opacity: 0.5,
              flexShrink: 0,
            }}
          >
            {line.newLine || ''}
          </div>
        )}
        
        {/* Content */}
        <div style={{ flex: 1, whiteSpace: 'pre' }}>
          {line.content || ' '}
        </div>
      </div>
    );
  };
  
  const renderSplitView = () => {
    return (
      <div style={{ display: 'flex', gap: 1, background: themeColors.border.default }}>
        {/* Original */}
        <div style={{ flex: 1, background: themeColors.background.default, overflow: 'auto' }}>
          <div
            style={{
              padding: '4px 8px',
              background: themeColors.background.surface,
              borderBottom: `1px solid ${themeColors.border.default}`,
              fontSize: 12,
              color: themeColors.text.muted,
              textAlign: 'center',
            }}
          >
            Original
          </div>
          {diff.map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                fontFamily: tokens.fontFamily.mono,
                fontSize: 13,
                lineHeight: 1.5,
                height: 20,
                background:
                  line.type === 'removed'
                    ? themeColors.badge.error.bg
                    : line.type === 'added'
                    ? 'transparent'
                    : 'transparent',
              }}
            >
              {lineNumbers && (
                <div
                  style={{
                    width: 40,
                    textAlign: 'right',
                    paddingRight: 12,
                    color: themeColors.text.subtle,
                    userSelect: 'none',
                    opacity: 0.5,
                  }}
                >
                  {line.oldLine || ''}
                </div>
              )}
              <div style={{ flex: 1, whiteSpace: 'pre', overflow: 'hidden' }}>
                {line.type !== 'added' ? line.content || ' ' : ''}
              </div>
            </div>
          ))}
        </div>
        
        {/* Modified */}
        <div style={{ flex: 1, background: themeColors.background.default, overflow: 'auto' }}>
          <div
            style={{
              padding: '4px 8px',
              background: themeColors.background.surface,
              borderBottom: `1px solid ${themeColors.border.default}`,
              fontSize: 12,
              color: themeColors.text.muted,
              textAlign: 'center',
            }}
          >
            Modified
          </div>
          {diff.map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                fontFamily: tokens.fontFamily.mono,
                fontSize: 13,
                lineHeight: 1.5,
                height: 20,
                background:
                  line.type === 'added'
                    ? themeColors.badge.info.bg
                    : 'transparent',
              }}
            >
              {lineNumbers && (
                <div
                  style={{
                    width: 40,
                    textAlign: 'right',
                    paddingRight: 12,
                    color: themeColors.text.subtle,
                    userSelect: 'none',
                    opacity: 0.5,
                  }}
                >
                  {line.newLine || ''}
                </div>
              )}
              <div style={{ flex: 1, whiteSpace: 'pre', overflow: 'hidden' }}>
                {line.type !== 'removed' ? line.content || ' ' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div
      className={className}
      data-component="diff-viewer"
      data-mode={mode}
      role="region"
      aria-label="Diff viewer"
      style={{
        background: themeColors.background.default,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
        border: `1px solid ${themeColors.border.default}`,
      }}
    >
      {/* Header */}
      {(showFilename || showStats) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: themeColors.background.surface,
            borderBottom: `1px solid ${themeColors.border.default}`,
          }}
        >
          {showFilename && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: themeColors.text.default,
              }}
            >
              {filename || 'File diff'}
            </div>
          )}
          
          {showStats && (
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span style={{ color: themeColors.accent.cyan }}>
                +{stats.additions}
              </span>
              <span style={{ color: themeColors.accent.red }}>
                -{stats.deletions}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Diff content */}
      {mode === 'unified' ? (
        <div style={{ overflow: 'auto' }}>
          {hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex}>
              {/* Hunk header */}
              {hunks.length > 1 && (
                <div
                  onClick={() => handleHunkClick(hunk)}
                  style={{
                    padding: '4px 12px',
                    background: themeColors.background.elevated,
                    fontSize: 12,
                    color: themeColors.text.muted,
                    fontFamily: tokens.fontFamily.mono,
                    cursor: onHunkClick ? 'pointer' : 'default',
                  }}
                >
                  {hunk.header}
                </div>
              )}
              {hunk.lines.map(renderUnifiedLine)}
            </div>
          ))}
        </div>
      ) : (
        renderSplitView()
      )}
    </div>
  );
};

export default DiffViewer;
