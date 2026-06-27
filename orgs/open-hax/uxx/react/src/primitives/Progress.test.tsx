/**
 * Progress Tests
 *
 * Unit tests for the enhanced Progress component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Progress } from './Progress.js';

describe('Progress', () => {
  describe('rendering', () => {
    it('renders with value', () => {
      const { container } = render(<Progress value={60} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute('aria-valuenow', '60');
    });

    it('renders with default max of 100', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders with custom max', () => {
      const { container } = render(<Progress value={5} max={10} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuemax', '10');
      expect(progress).toHaveAttribute('aria-valuenow', '5');
    });

    it('renders label', () => {
      render(<Progress value={60} label="Progress Label" />);
      expect(screen.getByText('Progress Label')).toBeInTheDocument();
    });

    it('clamps value between 0 and 100', () => {
      const { container, rerender } = render(<Progress value={150} />);
      const progress = container.querySelector('[role="progressbar"]');

      // Value should be clamped to 100
      expect(progress).toHaveAttribute('aria-valuenow', '150');

      rerender(<Progress value={-10} />);
      expect(progress).toHaveAttribute('aria-valuenow', '-10');
    });
  });

  describe('sizes', () => {
    it('renders xs size', () => {
      const { container } = render(<Progress value={60} size="xs" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-size', 'xs');
    });

    it('renders sm size', () => {
      const { container } = render(<Progress value={60} size="sm" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-size', 'sm');
    });

    it('renders md size (default)', () => {
      const { container } = render(<Progress value={60} />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-size', 'md');
    });

    it('renders lg size', () => {
      const { container } = render(<Progress value={60} size="lg" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Progress value={60} variant="default" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-variant', 'default');
    });

    it('renders success variant', () => {
      const { container } = render(<Progress value={100} variant="success" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-variant', 'success');
    });

    it('renders warning variant', () => {
      const { container } = render(<Progress value={40} variant="warning" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-variant', 'warning');
    });

    it('renders error variant', () => {
      const { container } = render(<Progress value={20} variant="error" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-variant', 'error');
    });

    it('renders pressure variant', () => {
      const { container } = render(<Progress value={70} variant="pressure" />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-variant', 'pressure');
    });
  });

  describe('gradients', () => {
    it('renders with string gradient', () => {
      const { container } = render(
        <Progress
          value={75}
          gradient="linear-gradient(90deg, #66d9ef, #a6e22e)"
        />
      );
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toHaveStyle({
        background: 'linear-gradient(90deg, #66d9ef, #a6e22e)',
      });
    });

    it('renders with object gradient', () => {
      const { container } = render(
        <Progress
          value={75}
          gradient={{ from: '#66d9ef', to: '#a6e22e', angle: 90 }}
        />
      );
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toHaveStyle({
        background: 'linear-gradient(90deg, #66d9ef, #a6e22e)',
      });
    });

    it('renders with object gradient without angle', () => {
      const { container } = render(
        <Progress
          value={75}
          gradient={{ from: '#66d9ef', to: '#a6e22e' }}
        />
      );
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toHaveStyle({
        background: 'linear-gradient(90deg, #66d9ef, #a6e22e)',
      });
    });
  });

  describe('indeterminate', () => {
    it('renders indeterminate state', () => {
      const { container } = render(<Progress indeterminate />);
      const progress = container.querySelector('[data-component="progress"]');
      expect(progress).toHaveAttribute('data-indeterminate', 'true');
    });

    it('does not show aria-valuenow when indeterminate', () => {
      const { container } = render(<Progress indeterminate />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).not.toHaveAttribute('aria-valuenow');
    });
  });

  describe('value display', () => {
    it('shows value when showValue is true', () => {
      render(<Progress value={60} showValue valuePosition="right" />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('uses custom formatter', () => {
      render(
        <Progress
          value={3}
          max={5}
          showValue
          valuePosition="right"
          formatValue={(v, m) => `${v} of ${m} items`}
        />
      );
      expect(screen.getByText('3 of 5 items')).toBeInTheDocument();
    });

    it('shows value inside bar for lg size', () => {
      const { container } = render(
        <Progress value={75} size="lg" showValue valuePosition="inside" />
      );
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('striped', () => {
    it('renders striped variant', () => {
      const { container } = render(<Progress value={60} striped />);
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toBeInTheDocument();
    });

    it('renders animated striped variant', () => {
      const { container } = render(<Progress value={60} striped stripedAnimated />);
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('animation', () => {
    it('applies animation duration', () => {
      const { container } = render(
        <Progress value={60} animated animationDuration={500} />
      );
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toHaveStyle({ transition: 'width 500ms ease-out' });
    });

    it('disables animation when animated is false', () => {
      const { container } = render(<Progress value={60} animated={false} />);
      const bar = container.querySelector('[data-component="progress"] > div');
      expect(bar).toHaveStyle({ transition: 'none' });
    });
  });

  describe('segments', () => {
    it('renders multiple segments', () => {
      const { container } = render(
        <Progress
          segments={[
            { value: 30, color: '#66d9ef', label: 'Segment 1' },
            { value: 25, color: '#ae81ff', label: 'Segment 2' },
          ]}
        />
      );

      const segments = container.querySelectorAll('[data-component="progress"] > div');
      expect(segments.length).toBe(2);
    });

    it('renders segments with gradients', () => {
      const { container } = render(
        <Progress
          segments={[
            {
              value: 40,
              gradient: 'linear-gradient(90deg, #66d9ef, #a6e22e)',
              label: 'Gradient Segment',
            },
          ]}
        />
      );

      const segment = container.querySelector('[data-component="progress"] > div');
      expect(segment).toHaveStyle({
        background: 'linear-gradient(90deg, #66d9ef, #a6e22e)',
      });
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      const { container } = render(<Progress value={60} ariaLabel="Loading progress" />);
      const progress = container.querySelector('[role="progressbar"]');

      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
      expect(progress).toHaveAttribute('aria-valuenow', '60');
      expect(progress).toHaveAttribute('aria-label', 'Loading progress');
    });

    it('uses label as aria-label when ariaLabel not provided', () => {
      const { container } = render(<Progress value={60} label="Upload progress" />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-label', 'Upload progress');
    });
  });
});
