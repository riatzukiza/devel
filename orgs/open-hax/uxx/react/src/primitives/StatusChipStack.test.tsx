import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChipStack } from './StatusChipStack';

describe('StatusChipStack', () => {
  const defaultItems = [
    { label: 'Active' },
    { label: 'Verified' },
    { label: 'Premium' },
  ];

  describe('rendering', () => {
    it('renders all items', () => {
      render(<StatusChipStack items={defaultItems} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders with default size (sm)', () => {
      render(<StatusChipStack items={defaultItems} />);
      const stack = document.querySelector('[data-component="status-chip-stack"]');
      expect(stack).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('sizes', () => {
    it('renders extra small size', () => {
      render(<StatusChipStack items={defaultItems} size="xs" />);
      const stack = document.querySelector('[data-component="status-chip-stack"]');
      expect(stack).toHaveAttribute('data-size', 'xs');
    });

    it('renders small size', () => {
      render(<StatusChipStack items={defaultItems} size="sm" />);
      const stack = document.querySelector('[data-component="status-chip-stack"]');
      expect(stack).toHaveAttribute('data-size', 'sm');
    });

    it('renders medium size', () => {
      render(<StatusChipStack items={defaultItems} size="md" />);
      const stack = document.querySelector('[data-component="status-chip-stack"]');
      expect(stack).toHaveAttribute('data-size', 'md');
    });
  });

  describe('variants', () => {
    it('renders items with different variants', () => {
      const items = [
        { label: 'Success', variant: 'success' as const },
        { label: 'Error', variant: 'error' as const },
      ];
      render(<StatusChipStack items={items} />);
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('uses default variant when not specified', () => {
      render(<StatusChipStack items={[{ label: 'Default' }]} />);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  describe('separator', () => {
    it('renders default separator between items', () => {
      render(<StatusChipStack items={defaultItems} />);
      const separators = screen.getAllByText('·');
      expect(separators).toHaveLength(2); // Between 3 items
    });

    it('renders custom separator', () => {
      render(<StatusChipStack items={defaultItems} separator="|" />);
      const separators = screen.getAllByText('|');
      expect(separators).toHaveLength(2);
    });

    it('does not render separator after last item', () => {
      render(<StatusChipStack items={defaultItems} />);
      const stack = document.querySelector('[data-component="status-chip-stack"]');
      const spans = stack?.querySelectorAll('span');
      // Last span should not have separator
      expect(spans?.[spans.length - 1]?.textContent).toBe('Premium');
    });

    it('renders no separator for single item', () => {
      render(<StatusChipStack items={[{ label: 'Only' }]} />);
      expect(screen.queryByText('·')).not.toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('renders items with icons', () => {
      const items = [
        { label: 'With Icon', icon: <span data-testid="icon">✓</span> },
      ];
      render(<StatusChipStack items={items} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders nothing when items is empty', () => {
      render(<StatusChipStack items={[]} />);
      const stack = document.querySelector('[data-component="status-chip-stack"]');
      expect(stack).toBeEmptyDOMElement();
    });
  });
});
