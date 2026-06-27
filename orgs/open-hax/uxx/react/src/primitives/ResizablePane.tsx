/**
 * ResizablePane Component
 * 
 * Implements the resizable-pane.edn contract.
 * A panel that supports bidirectional drag-resize with min/max constraints
 * and optional persistence to localStorage.
 */

import { useState, useRef, useCallback, useEffect, type ReactNode, type CSSProperties } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type ResizeDirection = 'left' | 'right';

export interface ResizablePaneProps {
  /** Current width of the pane in pixels */
  width?: number;
  /** Minimum width constraint */
  minWidth?: number;
  /** Maximum width constraint */
  maxWidth?: number;
  /** Which edge has the resize handle (left = handle on right, right = handle on left) */
  direction?: ResizeDirection;
  /** localStorage key for persisting width across sessions */
  persistenceKey?: string;
  /** Callback when width changes */
  onResize?: (newWidth: number) => void;
  /** Whether the pane can be collapsed */
  collapsible?: boolean;
  /** Whether the pane is currently collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapse?: (collapsed: boolean) => void;
  /** Width of the resize handle in pixels */
  handleWidth?: number;
  /** Whether to show the resize handle */
  showHandle?: boolean;
  /** Window width below which resizing is disabled */
  narrowLayoutBreakpoint?: number;
  /** Content to render inside the pane */
  children?: ReactNode;
}

/**
 * Load width from localStorage if available.
 */
function loadPersistedWidth(key: string | undefined, defaultWidth: number): number {
  if (!key) return defaultWidth;
  
  const stored = localStorage.getItem(key);
  if (!stored) return defaultWidth;
  
  const parsed = parseFloat(stored);
  return isNaN(parsed) ? defaultWidth : parsed;
}

/**
 * Save width to localStorage.
 */
function savePersistedWidth(key: string | undefined, width: number): void {
  if (key) {
    localStorage.setItem(key, String(width));
  }
}

/**
 * Check if we're in narrow layout mode.
 */
function isNarrowLayout(breakpoint: number): boolean {
  return window.innerWidth < breakpoint;
}

/**
 * Resizable pane component with drag-resize support.
 * 
 * @example
 * ```tsx
 * <ResizablePane
 *   width={280}
 *   minWidth={180}
 *   maxWidth={500}
 *   direction="left"
 *   persistenceKey="sidebar-width"
 *   onResize={(w) => setWidth(w)}
 * >
 *   <SidebarContent />
 * </ResizablePane>
 * ```
 */
export function ResizablePane({
  width = 240,
  minWidth = 100,
  maxWidth = 800,
  direction = 'right',
  persistenceKey,
  onResize,
  collapsible = false,
  collapsed = false,
  onCollapse,
  handleWidth = 3,
  showHandle = true,
  narrowLayoutBreakpoint = 820,
  children,
}: ResizablePaneProps) {
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  
  // Current width (controlled or from persistence)
  const [currentWidth, setCurrentWidth] = useState(() => 
    loadPersistedWidth(persistenceKey, width)
  );
  
  // Track narrow layout
  const [isNarrow, setIsNarrow] = useState(() => isNarrowLayout(narrowLayoutBreakpoint));
  
  // Handle window resize for narrow layout detection
  useEffect(() => {
    const handleWindowResize = () => {
      setIsNarrow(isNarrowLayout(narrowLayoutBreakpoint));
    };
    
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [narrowLayoutBreakpoint]);
  
  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidth;
    document.body.style.cursor = 'col-resize';
  }, [currentWidth]);
  
  // Handle drag move and end
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const dx = e.clientX - dragStartX.current;
      const newWidth = direction === 'left'
        ? dragStartWidth.current + dx
        : dragStartWidth.current - dx;
      
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setCurrentWidth(clampedWidth);
      onResize?.(clampedWidth);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      savePersistedWidth(persistenceKey, currentWidth);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minWidth, maxWidth, onResize, persistenceKey, currentWidth]);
  
  // Effective width (0 if collapsed)
  const effectiveWidth = collapsed ? 0 : currentWidth;
  
  // Container styles
  const containerStyle: CSSProperties = {
    width: `${effectiveWidth}px`,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
  
  // Handle styles
  const handleStyle: CSSProperties = {
    position: 'absolute',
    [direction === 'left' ? 'right' : 'left']: -(handleWidth - 1),
    top: 0,
    bottom: 0,
    width: `${handleWidth}px`,
    cursor: isNarrow ? undefined : 'col-resize',
    zIndex: 2,
    backgroundColor: isDragging ? tokens.colors.accent.cyan : 'transparent',
    transition: `background-color ${tokens.duration.fast} ${tokens.easing.easeInOut}`,
  };
  
  return (
    <div
      data-component="resizable-pane"
      data-direction={direction}
      data-collapsed={collapsed || undefined}
      data-resizing={isDragging || undefined}
      style={containerStyle}
    >
      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: collapsed ? 'none' : 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
      
      {/* Resize handle (not shown in narrow layout or when collapsed) */}
      {showHandle && !isNarrow && !collapsed && (
        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
          style={handleStyle}
        />
      )}
    </div>
  );
}

export default ResizablePane;
