/**
 * Modal Component
 * 
 * Implements the modal.edn contract.
 * Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
 */

import { 
  forwardRef, 
  type ReactNode, 
  useEffect, 
  useCallback, 
  useRef,
  useId
} from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ScrollBehavior = 'inside' | 'outside';

export interface ModalProps {
  /** Whether the modal is currently open */
  open?: boolean;
  /** Callback fired when modal should close */
  onClose: () => void;
  /** Size of the modal dialog */
  size?: ModalSize;
  /** Whether the modal can be closed by user interaction */
  closable?: boolean;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Whether to center the modal vertically */
  centered?: boolean;
  /** Scroll behavior */
  scrollBehavior?: ScrollBehavior;
  /** Header slot */
  header?: ReactNode;
  /** Title text (rendered in header if no header slot) */
  title?: string;
  /** Main content */
  children?: ReactNode;
  /** Footer slot */
  footer?: ReactNode;
}

// Size styles from contract
const sizeStyles: Record<ModalSize, React.CSSProperties> = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '600px' },
  lg: { maxWidth: '800px' },
  xl: { maxWidth: '1000px' },
  full: { 
    maxWidth: 'calc(100vw - 64px)', 
    maxHeight: 'calc(100vh - 64px)' 
  },
};

// Backdrop styles
const backdropStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'var(--token-colors-background-overlay)',
  backdropFilter: 'blur(4px)',
  zIndex: tokens.zIndex.modal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
};

// Modal container styles
const modalStyles: React.CSSProperties = {
  backgroundColor: tokens.colors.background.elevated,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow['2xl'],
  border: `1px solid ${tokens.colors.border.subtle}`,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxHeight: 'calc(100vh - 64px)',
  fontFamily: tokens.fontFamily.sans,
};

// Header styles
const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  fontWeight: tokens.fontWeight.semibold,
  fontSize: tokens.fontSize.lg,
};

// Body styles
const bodyStyles: React.CSSProperties = {
  flex: 1,
  padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
  overflowY: 'auto',
};

// Footer styles
const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
  borderTop: `1px solid ${tokens.colors.border.default}`,
};

// Close button styles
const closeButtonStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${tokens.spacing[1]}px`,
  fontSize: '20px',
  lineHeight: 1,
  color: tokens.colors.text.muted,
  transition: tokens.transitions.colors,
};

/**
 * Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
 * 
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * <Modal open={open} onClose={() => setOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <Button onClick={() => setOpen(false)}>Cancel</Button>
 *   <Button variant="primary">Confirm</Button>
 * </Modal>
 * ```
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open = false,
      onClose,
      size = 'md',
      closable = true,
      closeOnBackdrop = true,
      closeOnEscape = true,
      centered = true,
      scrollBehavior = 'inside',
      header,
      title,
      children,
      footer,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const descriptionId = useId();

    // Store the previously focused element and restore on close
    useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        
        // Focus the modal
        modalRef.current?.focus();
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        
        return () => {
          // Restore scroll
          document.body.style.overflow = '';
          
          // Restore focus
          previousActiveElement.current?.focus();
        };
      }
    }, [open]);

    // Handle Escape key
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && closable && closeOnEscape) {
          onClose();
        }
      },
      [closable, closeOnEscape, onClose]
    );

    // Handle backdrop click
    const handleBackdropClick = useCallback(
      (event: React.MouseEvent) => {
        if (
          closeOnBackdrop &&
          closable &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      },
      [closeOnBackdrop, closable, onClose]
    );

    // Focus trap
    const handleModalKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (!focusableElements || focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      },
      []
    );

    if (!open) return null;

    const modalContent = (
      <div
        data-component="modal"
        data-size={size}
        data-open={open}
        style={backdropStyles}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={(node) => {
            // Handle both refs
            (modalRef as any).current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          style={{ ...modalStyles, ...sizeStyles[size] }}
          onKeyDown={handleModalKeyDown}
        >
          {(header !== undefined || title !== undefined) && (
            <div style={headerStyles}>
              <div id={titleId} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
                {header}
                {title && !header && <span>{title}</span>}
              </div>
              {closable && (
                <button
                  type="button"
                  style={closeButtonStyles}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  ×
                </button>
              )}
            </div>
          )}
          
          <div id={descriptionId} style={bodyStyles}>
            {children}
          </div>
          
          {footer !== undefined && (
            <div style={footerStyles}>{footer}</div>
          )}
        </div>
      </div>
    );

    // Render in portal
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

export default Modal;
