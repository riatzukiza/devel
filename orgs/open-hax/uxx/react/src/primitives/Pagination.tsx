/**
 * Pagination Component
 * 
 * Implements the pagination.edn contract.
 * Page navigation controls with previous/next buttons and status display.
 */

import { tokens } from '@open-hax/uxx/tokens';
import type { CSSProperties } from 'react';

export interface PaginationProps {
  /** Current page number (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Whether pagination is disabled */
  disabled?: boolean;
  /** Whether to show 'Page X of Y' status */
  showStatus?: boolean;
  /** Label for previous button */
  previousLabel?: string;
  /** Label for next button */
  nextLabel?: string;
}

const containerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: `${tokens.spacing[3]}px`,
  padding: `${tokens.spacing[3]}px`,
  borderTop: `1px solid ${tokens.colors.border.default}`,
  backgroundColor: tokens.colors.background.surface,
};

const buttonStyles: CSSProperties = {
  padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
  borderRadius: `${tokens.spacing[1]}px`,
  border: `1px solid ${tokens.colors.border.default}`,
  backgroundColor: tokens.colors.background.default,
  color: tokens.colors.text.default,
  fontFamily: tokens.fontFamily.sans,
  fontSize: tokens.fontSize.sm,
  fontWeight: tokens.fontWeight.medium,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const buttonDisabledStyles: CSSProperties = {
  ...buttonStyles,
  cursor: 'not-allowed',
  color: tokens.colors.text.muted,
  opacity: 0.6,
};

const statusStyles: CSSProperties = {
  fontSize: tokens.fontSize.sm,
  color: tokens.colors.text.secondary,
  fontFamily: tokens.fontFamily.sans,
};

/**
 * Pagination controls for navigating through paged content.
 * 
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={10}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  showStatus = true,
  previousLabel = 'Previous',
  nextLabel = 'Next',
}: PaginationProps) {
  const canGoPrevious = page > 1 && !disabled;
  const canGoNext = page < totalPages && !disabled;
  
  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(page - 1);
    }
  };
  
  const handleNext = () => {
    if (canGoNext) {
      onPageChange(page + 1);
    }
  };
  
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div
      data-component="pagination"
      data-page={page}
      data-total-pages={totalPages}
      style={containerStyles}
      role="navigation"
      aria-label="Pagination"
    >
      <button
        data-testid="pagination-prev"
        onClick={handlePrevious}
        disabled={!canGoPrevious || disabled}
        style={canGoPrevious ? buttonStyles : buttonDisabledStyles}
        aria-label="Go to previous page"
      >
        {previousLabel}
      </button>
      
      {showStatus && (
        <span
          data-testid="pagination-status"
          style={statusStyles}
          aria-live="polite"
        >
          Page {page} of {totalPages}
        </span>
      )}
      
      <button
        data-testid="pagination-next"
        onClick={handleNext}
        disabled={!canGoNext || disabled}
        style={canGoNext ? buttonStyles : buttonDisabledStyles}
        aria-label="Go to next page"
      >
        {nextLabel}
      </button>
    </div>
  );
}

/**
 * Utility function to paginate items.
 * Returns a slice of items for the given page.
 * 
 * @param items - Array of items to paginate
 * @param page - Current page (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated slice of items
 * 
 * @example
 * ```tsx
 * const pageItems = paginateItems(allItems, 2, 10);
 * // Returns items 11-20
 * ```
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): T[] {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const offset = (safePage - 1) * safePageSize;
  
  return items.slice(offset, offset + safePageSize);
}

/**
 * Utility function to calculate total pages.
 * 
 * @param totalItems - Total number of items
 * @param pageSize - Number of items per page
 * @returns Total number of pages (minimum 1)
 * 
 * @example
 * ```tsx
 * const totalPages = calculateTotalPages(95, 10);
 * // Returns 10
 * ```
 */
export function calculateTotalPages(
  totalItems: number,
  pageSize: number
): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}
