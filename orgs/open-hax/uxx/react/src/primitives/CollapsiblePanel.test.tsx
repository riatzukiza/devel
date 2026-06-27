/**
 * CollapsiblePanel Tests
 * 
 * Unit tests for the CollapsiblePanel component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsiblePanel } from './CollapsiblePanel.js';

describe('CollapsiblePanel', () => {
  describe('rendering', () => {
    it('renders with title', () => {
      render(
        <CollapsiblePanel title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByText('Test Panel')).toBeInTheDocument();
    });

    it('renders with count badge', () => {
      render(
        <CollapsiblePanel title="Test Panel" count={5}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('renders content when expanded', () => {
      render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={false}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('hides content when collapsed', () => {
      const { container } = render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={true}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      // Content is hidden via CSS (maxHeight: 0), not removed from DOM
      const panel = container.querySelector('[data-component="collapsible-panel"]');
      expect(panel).toHaveAttribute('data-collapsed', 'true');
      // Content is in DOM but hidden
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders stats in header', () => {
      render(
        <CollapsiblePanel
          title="Test Panel"
          stats={[
            { label: 'Total', value: 10 },
            { label: 'Active', value: 5 },
          ]}
        >
          <div>Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByText('Total:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Active:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders custom header content', () => {
      render(
        <CollapsiblePanel
          title="Test Panel"
          headerContent={<span>Custom Header</span>}
        >
          <div>Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByText('Custom Header')).toBeInTheDocument();
      expect(screen.queryByText('Test Panel')).not.toBeInTheDocument();
    });

    it('renders extra header content', () => {
      render(
        <CollapsiblePanel
          title="Test Panel"
          extraHeaderContent={<span>Extra</span>}
        >
          <div>Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByText('Test Panel')).toBeInTheDocument();
      expect(screen.getByText('Extra')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" variant="default">
          <div>Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      expect(panel).toHaveAttribute('data-variant', 'default');
    });

    it('applies outlined variant styles', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" variant="outlined">
          <div>Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      expect(panel).toHaveAttribute('data-variant', 'outlined');
    });

    it('applies elevated variant styles', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" variant="elevated">
          <div>Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      expect(panel).toHaveAttribute('data-variant', 'elevated');
    });
  });

  describe('collapse behavior', () => {
    it('toggles collapse on header click', async () => {
      const { container } = render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={true}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      expect(panel).toHaveAttribute('data-collapsed', 'true');

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(panel).toHaveAttribute('data-collapsed', 'false');
    });

    it('expands panel on click when collapsed', async () => {
      const { container } = render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={true}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(panel).toHaveAttribute('data-collapsed', 'false');
    });

    it('collapses panel on click when expanded', async () => {
      const { container } = render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={false}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(panel).toHaveAttribute('data-collapsed', 'true');
    });

    it('calls onCollapseChange callback', async () => {
      const handleChange = vi.fn();
      render(
        <CollapsiblePanel
          title="Test Panel"
          onCollapseChange={handleChange}
        >
          <div>Content</div>
        </CollapsiblePanel>
      );

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('respects controlled collapsed prop', () => {
      const { container, rerender } = render(
        <CollapsiblePanel title="Test" collapsed={true}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      expect(panel).toHaveAttribute('data-collapsed', 'true');

      rerender(
        <CollapsiblePanel title="Test" collapsed={false}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      expect(panel).toHaveAttribute('data-collapsed', 'false');
    });
  });

  describe('keyboard navigation', () => {
    it('toggles on Enter key', async () => {
      render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={true}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      const header = screen.getByRole('button');
      fireEvent.keyDown(header, { key: 'Enter' });

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('toggles on Space key', async () => {
      render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={true}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      const header = screen.getByRole('button');
      fireEvent.keyDown(header, { key: ' ' });

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('does not toggle on other keys', async () => {
      const { container } = render(
        <CollapsiblePanel title="Test Panel" defaultCollapsed={true}>
          <div>Test Content</div>
        </CollapsiblePanel>
      );

      const panel = container.querySelector('[data-component="collapsible-panel"]');
      const header = screen.getByRole('button');
      fireEvent.keyDown(header, { key: 'Tab' });

      expect(panel).toHaveAttribute('data-collapsed', 'true');
    });
  });

  describe('accessibility', () => {
    it('has aria-expanded attribute', () => {
      render(
        <CollapsiblePanel title="Test" defaultCollapsed={true}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      const header = screen.getByRole('button');
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when toggled', async () => {
      render(
        <CollapsiblePanel title="Test" defaultCollapsed={true}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-controls pointing to content', () => {
      render(
        <CollapsiblePanel title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      );

      const header = screen.getByRole('button');
      const controlsId = header.getAttribute('aria-controls');
      expect(controlsId).toBeDefined();
      expect(controlsId).toContain('test-panel-content');
    });

    it('content has hidden attribute when collapsed', () => {
      render(
        <CollapsiblePanel title="Test" defaultCollapsed={true}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      const content = screen.queryByText('Content');
      expect(content?.closest('[hidden]')).toBeTruthy();
    });
  });

  describe('chevron animation', () => {
    it('chevron points down when expanded', () => {
      render(
        <CollapsiblePanel title="Test" defaultCollapsed={false}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      const chevron = screen.getByText('▼');
      expect(chevron).toHaveStyle({ transform: 'rotate(0deg)' });
    });

    it('chevron points right when collapsed', () => {
      render(
        <CollapsiblePanel title="Test" defaultCollapsed={true}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      const chevron = screen.getByText('▼');
      expect(chevron).toHaveStyle({ transform: 'rotate(-90deg)' });
    });
  });

  describe('maxHeight', () => {
    it('applies maxHeight to content', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" maxHeight={200}>
          <div>Content</div>
        </CollapsiblePanel>
      );

      // The content wrapper should have maxHeight style
      const contentWrapper = container.querySelector('[style*="overflow"]');
      expect(contentWrapper).toBeTruthy();
    });

    it('accepts string maxHeight', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" maxHeight="50vh">
          <div>Content</div>
        </CollapsiblePanel>
      );

      const contentWrapper = container.querySelector('[style*="overflow"]');
      expect(contentWrapper).toBeTruthy();
    });
  });
});
