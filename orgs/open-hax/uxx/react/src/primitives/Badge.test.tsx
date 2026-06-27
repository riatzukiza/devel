/**
 * Badge Tests
 *
 * Unit tests for the enhanced Badge component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge.js';

describe('Badge', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'default');
    });

    it('renders with default size', () => {
      const { container } = render(<Badge>Default Size</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-size', 'md');
    });

    it('renders with role="status"', () => {
      const { container } = render(<Badge>Status</Badge>);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toBeInTheDocument();
    });

    it('renders with aria-label', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveAttribute('aria-label', 'success');
    });
  });

  describe('variants', () => {
    it('renders success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'success');
    });

    it('renders warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });

    it('renders error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'error');
    });

    it('renders info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'info');
    });

    it('renders open variant', () => {
      const { container } = render(<Badge variant="open">Open</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'open');
    });

    it('renders closed variant', () => {
      const { container } = render(<Badge variant="closed">Closed</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'closed');
    });

    it('renders merged variant', () => {
      const { container } = render(<Badge variant="merged">Merged</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'merged');
    });

    it('renders alive variant', () => {
      const { container } = render(<Badge variant="alive">Alive</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'alive');
    });

    it('renders dead variant', () => {
      const { container } = render(<Badge variant="dead">Dead</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'dead');
    });

    it('renders running variant', () => {
      const { container } = render(<Badge variant="running">Running</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'running');
    });

    it('renders stopped variant', () => {
      const { container } = render(<Badge variant="stopped">Stopped</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'stopped');
    });
  });

  describe('sizes', () => {
    it('renders xs size', () => {
      const { container } = render(<Badge size="xs">XS</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-size', 'xs');
    });

    it('renders sm size', () => {
      const { container } = render(<Badge size="sm">SM</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-size', 'sm');
    });

    it('renders md size', () => {
      const { container } = render(<Badge size="md">MD</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-size', 'md');
    });

    it('renders lg size', () => {
      const { container } = render(<Badge size="lg">LG</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('dot indicator', () => {
    it('renders dot when dot prop is true', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-dot', 'true');
    });

    it('does not render dot by default', () => {
      const { container } = render(<Badge>No Dot</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).not.toHaveAttribute('data-dot');
    });
  });

  describe('pulse animation', () => {
    it('renders with pulse attribute when pulse prop is true', () => {
      const { container } = render(
        <Badge dot pulse>
          Pulsing
        </Badge>
      );
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-pulse', 'true');
    });

    it('does not have pulse attribute by default', () => {
      const { container } = render(<Badge>No Pulse</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).not.toHaveAttribute('data-pulse');
    });
  });

  describe('rounded', () => {
    it('renders with rounded attribute when rounded prop is true', () => {
      const { container } = render(<Badge rounded>Rounded</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-rounded', 'true');
    });

    it('does not have rounded attribute by default', () => {
      const { container } = render(<Badge>Not Rounded</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).not.toHaveAttribute('data-rounded');
    });
  });

  describe('outline', () => {
    it('renders with outline attribute when outline prop is true', () => {
      const { container } = render(<Badge outline>Outline</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-outline', 'true');
    });

    it('does not have outline attribute by default', () => {
      const { container } = render(<Badge>Filled</Badge>);
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).not.toHaveAttribute('data-outline');
    });
  });

  describe('icons', () => {
    it('renders iconStart', () => {
      render(
        <Badge iconStart={<span data-testid="icon-start">✓</span>}>
          With Icon Start
        </Badge>
      );
      expect(screen.getByTestId('icon-start')).toBeInTheDocument();
    });

    it('renders iconEnd', () => {
      render(
        <Badge iconEnd={<span data-testid="icon-end">→</span>}>
          With Icon End
        </Badge>
      );
      expect(screen.getByTestId('icon-end')).toBeInTheDocument();
    });

    it('renders both icons', () => {
      render(
        <Badge
          iconStart={<span data-testid="icon-start">✓</span>}
          iconEnd={<span data-testid="icon-end">→</span>}
        >
          Both Icons
        </Badge>
      );
      expect(screen.getByTestId('icon-start')).toBeInTheDocument();
      expect(screen.getByTestId('icon-end')).toBeInTheDocument();
    });
  });

  describe('custom dot color', () => {
    it('renders dot with custom color', () => {
      const { container } = render(
        <Badge dot dotColor="#ff0000">
          Custom Color
        </Badge>
      );
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Custom</Badge>);
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('backward compatibility', () => {
    it('supports existing API (variant, size, dot, rounded, outline)', () => {
      const { container } = render(
        <Badge variant="success" size="sm" dot rounded outline>
          Legacy
        </Badge>
      );
      const badge = container.querySelector('[data-component="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'success');
      expect(badge).toHaveAttribute('data-size', 'sm');
      expect(badge).toHaveAttribute('data-dot', 'true');
      expect(badge).toHaveAttribute('data-rounded', 'true');
      expect(badge).toHaveAttribute('data-outline', 'true');
    });
  });
});
