/**
 * Toast Component
 * 
 * Implements the toast.edn contract.
 * Non-blocking notification toasts with auto-dismiss and action support.
 */

import { 
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
  type CSSProperties
} from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  icon?: ReactNode;
}

export interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

export interface ToastContainerProps {
  position?: ToastPosition;
  children?: ReactNode;
}

// Context for toast management
interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<ToastData>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Type colors
const typeColors: Record<ToastType, { bg: string; border: string }> = {
  info: { 
    bg: tokens.colors.badge.info.bg,
    border: tokens.colors.semantic.info,
  },
  success: { 
    bg: tokens.colors.badge.success.bg,
    border: tokens.colors.semantic.success,
  },
  warning: { 
    bg: tokens.colors.badge.warning.bg,
    border: tokens.colors.semantic.warning,
  },
  error: { 
    bg: tokens.colors.badge.error.bg,
    border: tokens.colors.semantic.error,
  },
};

// Type icons
const typeIcons: Record<ToastType, string> = {
  info: 'ℹ️',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

// Toast container styles by position
const containerPositionStyles: Record<ToastPosition, CSSProperties> = {
  'top-right': { top: '16px', right: '16px' },
  'top-left': { top: '16px', left: '16px' },
  'bottom-right': { bottom: '16px', right: '16px' },
  'bottom-left': { bottom: '16px', left: '16px' },
  'top-center': { top: '16px', left: '50%', transform: 'translateX(-50%)' },
  'bottom-center': { bottom: '16px', left: '50%', transform: 'translateX(-50%)' },
};

// Toast container base styles
const containerStyles: CSSProperties = {
  position: 'fixed',
  zIndex: tokens.zIndex.toast,
  display: 'flex',
  flexDirection: 'column',
  gap: `${tokens.spacing[2]}px`,
  maxWidth: '400px',
  width: 'calc(100vw - 32px)',
};

// Individual toast styles
const toastStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: `${tokens.spacing[3]}px`,
  padding: `${tokens.spacing[4]}px`,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.lg,
  borderLeft: '4px solid',
  fontFamily: tokens.fontFamily.sans,
  animation: 'slideIn 0.2s ease-out',
};

// Dismiss button styles
const dismissButtonStyles: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px',
  fontSize: '16px',
  lineHeight: 1,
  color: tokens.colors.text.muted,
  flexShrink: 0,
};

// Action button styles
const actionButtonStyles: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
  fontSize: tokens.fontSize.sm,
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.accent.cyan,
  textDecoration: 'underline',
};

/**
 * Individual toast notification.
 */
function ToastItem({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  dismissible = true,
  action,
  icon,
  onDismiss,
}: ToastProps) {
  const [paused, setPaused] = useState(false);
  const colors = typeColors[type];
  const displayIcon = icon || typeIcons[type];

  useEffect(() => {
    if (duration === 0 || paused) return;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, paused, onDismiss]);

  return (
    <div
      data-component="toast"
      data-type={type}
      role="alert"
      aria-live="polite"
      style={{
        ...toastStyles,
        backgroundColor: colors.bg,
        borderLeftColor: colors.border,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span style={{ fontSize: '18px' }}>{displayIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ 
            fontWeight: tokens.fontWeight.semibold,
            marginBottom: tokens.spacing[1],
            color: tokens.colors.text.default,
          }}>
            {title}
          </div>
        )}
        <div style={{ 
          fontSize: tokens.fontSize.sm,
          color: tokens.colors.text.default,
        }}>
          {message}
        </div>
        {action && (
          <button
            style={{ ...actionButtonStyles, marginTop: `${tokens.spacing[2]}px` }}
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          style={dismissButtonStyles}
          onClick={() => onDismiss(id)}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Toast container that manages multiple toasts.
 */
export function ToastContainer({ 
  position = 'bottom-right',
  children 
}: ToastContainerProps) {
  return createPortal(
    <div
      style={{
        ...containerStyles,
        ...containerPositionStyles[position],
      }}
    >
      {children}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

/**
 * Toast provider for managing toast state.
 */
export function ToastProvider({ 
  children,
  position = 'bottom-right',
}: { 
  children: ReactNode;
  position?: ToastPosition;
}) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastData>) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, updateToast }}>
      {children}
      {toasts.length > 0 && (
        <ToastContainer position={position}>
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              {...toast}
              onDismiss={dismissToast}
            />
          ))}
        </ToastContainer>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Hook for toast management.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Re-export ToastItem as Toast for direct use
export const Toast = ToastItem;

export default Toast;
