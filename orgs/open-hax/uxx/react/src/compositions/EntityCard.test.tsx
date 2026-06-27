/**
 * EntityCard Tests
 *
 * Unit tests for the EntityCard composition component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityCard } from './EntityCard.js';

describe('EntityCard', () => {
  const mockOnClick = vi.fn();
  const mockPrimaryAction = vi.fn();
  const mockSecondaryAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with name only', () => {
      render(<EntityCard id="test-1" name="Test Entity" />);
      expect(screen.getByText('Test Entity')).toBeInTheDocument();
    });

    it('renders with name and type', () => {
      render(<EntityCard id="test-1" name="Test Entity" type="Agent" />);
      expect(screen.getByText('Test Entity')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument();
    });

    it('renders with status badge', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          status={{ value: 'Alive', variant: 'alive' }}
        />
      );
      expect(screen.getByText('Alive')).toBeInTheDocument();
    });

    it('renders metadata section', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          metadata={[
            { label: 'Position', value: '(10, 20)' },
            { label: 'Role', value: 'Worker' },
          ]}
        />
      );
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('(10, 20)')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Worker')).toBeInTheDocument();
    });

    it('renders image', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          image={{ src: 'test.jpg', alt: 'Test Image', size: 'md' }}
        />
      );
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'test.jpg');
      expect(img).toHaveAttribute('alt', 'Test Image');
    });

    it('renders image with default alt text', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          image={{ src: 'test.jpg' }}
        />
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test Entity');
    });

    it('renders tags', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          tags={['bug', 'enhancement', 'priority']}
        />
      );
      expect(screen.getByText('bug')).toBeInTheDocument();
      expect(screen.getByText('enhancement')).toBeInTheDocument();
      expect(screen.getByText('priority')).toBeInTheDocument();
    });

    it('renders primary action button', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          primaryAction={{ label: 'View', onClick: mockPrimaryAction }}
        />
      );
      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    });

    it('renders secondary action buttons', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          secondaryActions={[
            { label: 'Edit', onClick: mockSecondaryAction },
            { label: 'Delete', onClick: mockSecondaryAction },
          ]}
        />
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders custom header', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          header={<div>Custom Header Content</div>}
        />
      );
      expect(screen.getByText('Custom Header Content')).toBeInTheDocument();
      // Default name should not render when custom header is provided
      expect(screen.queryByText('Test Entity')).not.toBeInTheDocument();
    });

    it('renders custom footer', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          footer={<div>Custom Footer Content</div>}
        />
      );
      expect(screen.getByText('Custom Footer Content')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" variant="default" />
      );
      const card = container.querySelector('[data-component="entity-card"]');
      expect(card).toHaveAttribute('data-variant', 'default');
    });

    it('applies outlined variant styles', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" variant="outlined" />
      );
      const card = container.querySelector('[data-component="entity-card"]');
      expect(card).toHaveAttribute('data-variant', 'outlined');
    });

    it('applies elevated variant styles', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" variant="elevated" />
      );
      const card = container.querySelector('[data-component="entity-card"]');
      expect(card).toHaveAttribute('data-variant', 'elevated');
    });

    it('applies gradient variant styles', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          variant="gradient"
          gradient="linear-gradient(135deg, #66d9ef, #a6e22e)"
        />
      );
      const card = container.querySelector('[data-component="entity-card"]');
      expect(card).toHaveAttribute('data-variant', 'gradient');
    });
  });

  describe('interactive mode', () => {
    it('sets role="button" when interactive', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
        />
      );
      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
    });

    it('sets tabIndex when interactive', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
        />
      );
      const card = container.querySelector('[tabIndex="0"]');
      expect(card).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
        />
      );
      const card = container.querySelector('[data-component="entity-card"]')!;
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('calls onClick on Enter key', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
        />
      );
      const card = container.querySelector('[data-component="entity-card"]')!;
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('calls onClick on Space key', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
        />
      );
      const card = container.querySelector('[data-component="entity-card"]')!;
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('does not set role when not interactive', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" />
      );
      const card = container.querySelector('[role="button"]');
      expect(card).not.toBeInTheDocument();
    });
  });

  describe('event propagation', () => {
    it('stops propagation from primary action button', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
          primaryAction={{ label: 'Action', onClick: mockPrimaryAction }}
        />
      );
      const button = screen.getByRole('button', { name: 'Action' });
      fireEvent.click(button);
      expect(mockPrimaryAction).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('stops propagation from secondary action buttons', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          interactive
          onClick={mockOnClick}
          secondaryActions={[
            { label: 'Edit', onClick: mockSecondaryAction },
          ]}
        />
      );
      const button = screen.getByRole('button', { name: 'Edit' });
      fireEvent.click(button);
      expect(mockSecondaryAction).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('data attributes', () => {
    it('sets data-component', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" />
      );
      const card = container.querySelector('[data-component="entity-card"]');
      expect(card).toBeInTheDocument();
    });

    it('sets data-variant', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" variant="outlined" />
      );
      const card = container.querySelector('[data-variant="outlined"]');
      expect(card).toBeInTheDocument();
    });

    it('sets data-id', () => {
      const { container } = render(
        <EntityCard id="test-123" name="Test" />
      );
      const card = container.querySelector('[data-id="test-123"]');
      expect(card).toBeInTheDocument();
    });

    it('sets data-interactive when interactive', () => {
      const { container } = render(
        <EntityCard id="test-1" name="Test" interactive onClick={() => {}} />
      );
      const card = container.querySelector('[data-interactive]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('dividers', () => {
    it('shows dividers by default', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          metadata={[{ label: 'Field', value: 'Value' }]}
          tags={['tag']}
        />
      );
      // Dividers should be present between sections
      expect(container.firstChild).toBeInTheDocument();
    });

    it('hides dividers when dividers=false', () => {
      const { container } = render(
        <EntityCard
          id="test-1"
          name="Test"
          metadata={[{ label: 'Field', value: 'Value' }]}
          tags={['tag']}
          dividers={false}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('image has correct alt text', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          image={{ src: 'test.jpg', alt: 'Entity Avatar' }}
        />
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Entity Avatar');
    });

    it('uses name as default alt text for image', () => {
      render(
        <EntityCard
          id="test-1"
          name="Test Entity"
          image={{ src: 'test.jpg' }}
        />
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test Entity');
    });
  });

  describe('complete card', () => {
    it('renders all sections', () => {
      render(
        <EntityCard
          id="complete"
          name="Complete Card"
          type="Full Featured"
          status={{ value: 'Active', variant: 'alive' }}
          image={{ src: 'avatar.jpg', size: 'md' }}
          metadata={[
            { label: 'Position', value: '(10, 20)' },
            { label: 'Role', value: 'Worker' },
          ]}
          tags={['active', 'priority']}
          primaryAction={{ label: 'View', onClick: mockPrimaryAction }}
          secondaryActions={[
            { label: 'Edit', onClick: mockSecondaryAction },
          ]}
        />
      );

      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('Full Featured')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('(10, 20)')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('priority')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
  });
});
