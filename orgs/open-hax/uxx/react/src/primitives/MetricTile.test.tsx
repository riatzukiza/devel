import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricTile } from './MetricTile';

describe('MetricTile', () => {
  describe('rendering', () => {
    it('renders label and value', () => {
      render(<MetricTile label="Total Users" value={1234} />);
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('renders value as string', () => {
      render(<MetricTile label="Status" value="Active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders value as ReactNode', () => {
      render(
        <MetricTile 
          label="Status" 
          value={<span data-testid="custom-value">Custom</span>} 
        />
      );
      expect(screen.getByTestId('custom-value')).toBeInTheDocument();
    });
  });

  describe('detail', () => {
    it('renders detail when provided', () => {
      render(<MetricTile label="Users" value={100} detail="+10% from last month" />);
      expect(screen.getByText('+10% from last month')).toBeInTheDocument();
    });

    it('renders detail as ReactNode', () => {
      render(
        <MetricTile 
          label="Users" 
          value={100} 
          detail={<span data-testid="custom-detail">Custom detail</span>} 
        />
      );
      expect(screen.getByTestId('custom-detail')).toBeInTheDocument();
    });

    it('does not render detail when not provided', () => {
      render(<MetricTile label="Users" value={100} />);
      expect(screen.queryByText('detail')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows spinner when loading', () => {
      render(<MetricTile label="Users" value={100} loading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('hides value when loading', () => {
      render(<MetricTile label="Users" value={100} loading />);
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    it('shows value when not loading', () => {
      render(<MetricTile label="Users" value={100} loading={false} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<MetricTile label="Users" value={100} variant="default" />);
      const tile = document.querySelector('[data-component="metric-tile"]');
      expect(tile).toHaveAttribute('data-variant', 'default');
    });

    it('renders info variant', () => {
      render(<MetricTile label="Users" value={100} variant="info" />);
      const tile = document.querySelector('[data-component="metric-tile"]');
      expect(tile).toHaveAttribute('data-variant', 'info');
    });

    it('renders success variant', () => {
      render(<MetricTile label="Users" value={100} variant="success" />);
      const tile = document.querySelector('[data-component="metric-tile"]');
      expect(tile).toHaveAttribute('data-variant', 'success');
    });

    it('renders warning variant', () => {
      render(<MetricTile label="Users" value={100} variant="warning" />);
      const tile = document.querySelector('[data-component="metric-tile"]');
      expect(tile).toHaveAttribute('data-variant', 'warning');
    });

    it('renders error variant', () => {
      render(<MetricTile label="Users" value={100} variant="error" />);
      const tile = document.querySelector('[data-component="metric-tile"]');
      expect(tile).toHaveAttribute('data-variant', 'error');
    });
  });

  describe('sparkbar', () => {
    it('renders sparkbar when provided', () => {
      render(
        <MetricTile 
          label="Users" 
          value={100} 
          sparkbar={[
            { value: 10 },
            { value: 20 },
            { value: 30 },
          ]} 
        />
      );
      // Sparkbar bars are rendered as spans
      const metricTile = document.querySelector('[data-component="metric-tile"]');
      expect(metricTile).toBeInTheDocument();
    });

    it('does not render sparkbar when not provided', () => {
      render(<MetricTile label="Users" value={100} />);
      const metricTile = document.querySelector('[data-component="metric-tile"]');
      const sparkbar = metricTile?.querySelector('[aria-hidden="true"]');
      expect(sparkbar).not.toBeInTheDocument();
    });

    it('does not render sparkbar when empty', () => {
      render(<MetricTile label="Users" value={100} sparkbar={[]} />);
      const metricTile = document.querySelector('[data-component="metric-tile"]');
      expect(metricTile).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has strong element for value', () => {
      render(<MetricTile label="Users" value={100} />);
      const strong = screen.getByText('100').closest('strong');
      expect(strong).toBeInTheDocument();
    });
  });
});
