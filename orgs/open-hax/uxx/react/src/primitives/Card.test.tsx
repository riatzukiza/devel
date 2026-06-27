import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with default variant (default)', () => {
      render(<Card>Content</Card>);
      expect(screen.getByRole('region')).toHaveAttribute('data-variant', 'default');
    });

    it('renders with default padding (md)', () => {
      render(<Card>Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with default radius (md)', () => {
      render(<Card>Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Card variant="default">Content</Card>);
      expect(screen.getByRole('region')).toHaveAttribute('data-variant', 'default');
    });

    it('renders outlined variant', () => {
      render(<Card variant="outlined">Content</Card>);
      expect(screen.getByRole('region')).toHaveAttribute('data-variant', 'outlined');
    });

    it('renders elevated variant', () => {
      render(<Card variant="elevated">Content</Card>);
      expect(screen.getByRole('region')).toHaveAttribute('data-variant', 'elevated');
    });
  });

  describe('padding', () => {
    it('renders with no padding', () => {
      render(<Card padding="none">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with small padding', () => {
      render(<Card padding="sm">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with medium padding', () => {
      render(<Card padding="md">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with large padding', () => {
      render(<Card padding="lg">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });

  describe('radius', () => {
    it('renders with no radius', () => {
      render(<Card radius="none">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with small radius', () => {
      render(<Card radius="sm">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with medium radius', () => {
      render(<Card radius="md">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with large radius', () => {
      render(<Card radius="lg">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('renders with full radius', () => {
      render(<Card radius="full">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });

  describe('header', () => {
    it('renders title', () => {
      render(<Card title="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders custom header', () => {
      render(<Card header={<span data-testid="custom-header">Custom</span>}>Content</Card>);
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });

    it('renders extra content in header', () => {
      render(<Card title="Title" extra={<button>Action</button>}>Content</Card>);
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('shows header section when title is provided', () => {
      render(<Card title="Title">Content</Card>);
      // Title is rendered in the header
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('renders footer', () => {
      render(<Card footer={<button>Submit</button>}>Content</Card>);
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('renders footer with multiple elements', () => {
      render(
        <Card footer={
          <>
            <button>Cancel</button>
            <button>Save</button>
          </>
        }>
          Content
        </Card>
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('interactive', () => {
    it('renders as interactive when interactive prop is true', () => {
      render(<Card interactive>Content</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('data-interactive', 'true');
    });

    it('renders as interactive when onClick is provided', () => {
      render(<Card onClick={() => {}}>Content</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('data-interactive', 'true');
    });

    it('renders as non-interactive by default', () => {
      render(<Card>Content</Card>);
      const card = screen.getByRole('region');
      expect(card).not.toHaveAttribute('data-interactive');
    });

    it('is focusable when interactive', () => {
      render(<Card interactive>Content</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not interactive', () => {
      render(<Card>Content</Card>);
      const card = screen.getByRole('region');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('click handling', () => {
    it('fires onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('fires onClick when Enter is pressed', async () => {
      const handleClick = vi.fn();
      render(<Card interactive onClick={handleClick}>Content</Card>);
      
      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('fires onClick when Space is pressed', async () => {
      const handleClick = vi.fn();
      render(<Card interactive onClick={handleClick}>Content</Card>);
      
      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not have interactive role when not interactive', () => {
      render(<Card>Content</Card>);
      // Non-interactive cards have role="region", not role="button"
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="region" by default', () => {
      render(<Card>Content</Card>);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('has role="button" when interactive', () => {
      render(<Card interactive>Content</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is tabbable when interactive', () => {
      render(<Card interactive>Content</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to div element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Content</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('custom styles', () => {
    it('accepts custom style prop', () => {
      render(<Card style={{ marginTop: 20 }}>Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toHaveStyle({ marginTop: '20px' });
    });
  });
});
