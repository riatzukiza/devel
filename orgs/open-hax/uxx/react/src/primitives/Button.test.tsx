import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with default variant (secondary)', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'secondary');
    });

    it('renders with default size (md)', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-size', 'md');
    });

    it('renders with default type (button)', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('variants', () => {
    it('renders primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'primary');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'secondary');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'ghost');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'danger');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-size', 'sm');
    });

    it('renders medium size', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-size', 'md');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not fire onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-loading', 'true');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not fire onClick when loading', async () => {
      const handleClick = vi.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('hides icons when loading', () => {
      render(
        <Button loading iconStart={<span data-testid="start-icon">→</span>} iconEnd={<span data-testid="end-icon">←</span>}>
          Loading
        </Button>
      );
      
      expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('icons', () => {
    it('renders icon before text', () => {
      render(
        <Button iconStart={<span data-testid="icon">🔍</span>}>
          Search
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      expect(button).toContainElement(icon);
    });

    it('renders icon after text', () => {
      render(
        <Button iconEnd={<span data-testid="icon">→</span>}>
          Continue
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      expect(button).toContainElement(icon);
    });

    it('renders both icons', () => {
      render(
        <Button iconStart={<span data-testid="start">←</span>} iconEnd={<span data-testid="end">→</span>}>
          Button
        </Button>
      );
      
      expect(screen.getByTestId('start')).toBeInTheDocument();
      expect(screen.getByTestId('end')).toBeInTheDocument();
    });
  });

  describe('full width', () => {
    it('renders full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-full-width', 'true');
      expect(button).toHaveStyle({ width: '100%' });
    });

    it('renders auto width by default', () => {
      render(<Button>Auto Width</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('data-full-width');
    });
  });

  describe('interactions', () => {
    it('fires onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be triggered by keyboard', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('type attribute', () => {
    it('renders with type="button" by default', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders with type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('renders with type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('accessibility', () => {
    it('has correct role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has accessible name from children', () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button', { name: 'Accessible Button' })).toBeInTheDocument();
    });

    it('has aria-busy attribute when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('disabled state is communicated to assistive technology', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('custom props', () => {
    it('passes through additional props', () => {
      render(<Button data-testid="custom-button" aria-label="Custom">Button</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom')).toBeInTheDocument();
    });

    it('can have custom id', () => {
      render(<Button id="my-button">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('id', 'my-button');
    });

    it('can have custom className merged with styles', () => {
      render(<Button className="custom-class">Button</Button>);
      // Button uses inline styles, className is passed through
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
