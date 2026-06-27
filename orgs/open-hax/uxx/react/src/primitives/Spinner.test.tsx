import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders a spinner', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with default size (md)', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('data-size', 'md');
    });

    it('renders as SVG element', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner.tagName.toLowerCase()).toBe('svg');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Spinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'sm');
      expect(spinner).toHaveAttribute('width', '14');
      expect(spinner).toHaveAttribute('height', '14');
    });

    it('renders medium size', () => {
      render(<Spinner size="md" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'md');
      expect(spinner).toHaveAttribute('width', '16');
      expect(spinner).toHaveAttribute('height', '16');
    });

    it('renders large size', () => {
      render(<Spinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'lg');
      expect(spinner).toHaveAttribute('width', '20');
      expect(spinner).toHaveAttribute('height', '20');
    });

    it('renders extra large size', () => {
      render(<Spinner size="xl" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'xl');
      expect(spinner).toHaveAttribute('width', '24');
      expect(spinner).toHaveAttribute('height', '24');
    });
  });

  describe('color', () => {
    it('uses currentColor by default', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('stroke', 'currentColor');
    });

    it('can use custom color', () => {
      render(<Spinner color="#ff0000" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('stroke', '#ff0000');
    });
  });

  describe('thickness', () => {
    it('uses default thickness of 2.5', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('stroke-width', '2.5');
    });

    it('can use custom thickness', () => {
      render(<Spinner thickness={3} />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('stroke-width', '3');
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-busy="true"', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has default aria-label', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('can have custom aria-label', () => {
      render(<Spinner label="Loading content..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content...');
    });
  });

  describe('animation', () => {
    it('has animation style', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      const style = spinner.style.animation;
      expect(style).toContain('spin');
    });
  });

  describe('SVG structure', () => {
    it('has correct viewBox', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('contains path element', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      const path = spinner.querySelector('path');
      expect(path).toBeInTheDocument();
    });
  });
});
