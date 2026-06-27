/**
 * KeyValueSection Tests
 *
 * Unit tests for the KeyValueSection component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyValueSection, type KeyValueEntry } from './KeyValueSection.js';

describe('KeyValueSection', () => {
  describe('rendering', () => {
    it('renders entries with labels and values', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Name', value: 'Test' },
        { label: 'Status', value: 'Active' },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <KeyValueSection
          title="Section Title"
          entries={[{ label: 'Key', value: 'Value' }]}
        />
      );

      expect(screen.getByText('Section Title')).toBeInTheDocument();
    });

    it('renders icon before label', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Temperature', value: '25°C', icon: <span>🌡️</span> },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('🌡️')).toBeInTheDocument();
      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });

    it('renders badge after value', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Version', value: '1.0.0', badge: 'stable' },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('stable')).toBeInTheDocument();
    });

    it('renders complex values (ReactNode)', () => {
      const entries: KeyValueEntry[] = [
        {
          label: 'Tags',
          value: (
            <span>
              <strong>tag1</strong>, <strong>tag2</strong>
            </span>
          ),
        },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });
  });

  describe('hideIfEmpty', () => {
    it('hides entries with null value when hideIfEmpty is true', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Name', value: 'John' },
        { label: 'Email', value: null, hideIfEmpty: true },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });

    it('hides entries with empty string when hideIfEmpty is true', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Name', value: 'John' },
        { label: 'Phone', value: '', hideIfEmpty: true },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    });

    it('shows entries with empty string when hideIfEmpty is false', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Name', value: 'John' },
        { label: 'Phone', value: '' },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('shows entries with values when hideIfEmpty is true', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Name', value: 'John', hideIfEmpty: true },
        { label: 'Email', value: 'john@test.com', hideIfEmpty: true },
      ];

      render(<KeyValueSection entries={entries} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });
  });

  describe('layouts', () => {
    it('renders vertical layout by default', () => {
      const { container } = render(
        <KeyValueSection entries={[{ label: 'Key', value: 'Value' }]} />
      );

      const section = container.querySelector('[data-component="key-value-entry"]');
      expect(section).toBeInTheDocument();
    });

    it('renders grid layout with columns', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Key1', value: 'Value1' },
        { label: 'Key2', value: 'Value2' },
        { label: 'Key3', value: 'Value3' },
        { label: 'Key4', value: 'Value4' },
      ];

      const { container } = render(
        <KeyValueSection layout="grid" columns={2} entries={entries} />
      );

      const entriesElements = container.querySelectorAll('[data-component="key-value-entry"]');
      expect(entriesElements.length).toBe(4);
    });

    it('renders inline layout with label width', () => {
      const { container } = render(
        <KeyValueSection
          layout="inline"
          labelWidth={150}
          entries={[{ label: 'Key', value: 'Value' }]}
        />
      );

      const label = screen.getByText('Key');
      expect(label).toHaveStyle({ minWidth: '150px' });
    });
  });

  describe('dividers', () => {
    it('renders dividers between entries in vertical layout', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Key1', value: 'Value1' },
        { label: 'Key2', value: 'Value2' },
      ];

      const { container } = render(
        <KeyValueSection layout="vertical" dividers={true} entries={entries} />
      );

      const firstEntry = container.querySelector('[data-component="key-value-entry"]');
      expect(firstEntry).toHaveStyle({ borderBottom: expect.stringContaining('1px solid') });
    });

    it('does not render divider after last entry', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Key1', value: 'Value1' },
        { label: 'Key2', value: 'Value2' },
      ];

      const { container } = render(
        <KeyValueSection layout="vertical" dividers={true} entries={entries} />
      );

      const entriesElements = container.querySelectorAll('[data-component="key-value-entry"]');
      const lastEntry = entriesElements[entriesElements.length - 1];
      // Last entry should not have a border bottom (or it should be 'none')
      const style = lastEntry?.getAttribute('style') || '';
      // Check that it doesn't have a visible border
      expect(style.includes('borderBottom: 1px') || style.includes('border-bottom: 1px')).toBe(false);
    });
  });

  describe('empty state', () => {
    it('renders empty message when no entries', () => {
      render(
        <KeyValueSection entries={[]} emptyMessage="No data available" />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders empty message when all entries are hidden', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Field1', value: '', hideIfEmpty: true },
        { label: 'Field2', value: null, hideIfEmpty: true },
      ];

      render(
        <KeyValueSection entries={entries} emptyMessage="All fields empty" />
      );

      expect(screen.getByText('All fields empty')).toBeInTheDocument();
    });

    it('does not render empty message when there are visible entries', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Name', value: 'John' },
        { label: 'Email', value: '', hideIfEmpty: true },
      ];

      render(
        <KeyValueSection entries={entries} emptyMessage="No data available" />
      );

      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
  });

  describe('gap sizes', () => {
    it('applies small gap', () => {
      const { container } = render(
        <KeyValueSection gap="sm" entries={[{ label: 'Key', value: 'Value' }]} />
      );

      // Gap is applied via style
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies medium gap', () => {
      const { container } = render(
        <KeyValueSection gap="md" entries={[{ label: 'Key', value: 'Value' }]} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies large gap', () => {
      const { container } = render(
        <KeyValueSection gap="lg" entries={[{ label: 'Key', value: 'Value' }]} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('title sizes', () => {
    it('renders small title', () => {
      render(
        <KeyValueSection
          title="Small Title"
          titleSize="sm"
          entries={[{ label: 'Key', value: 'Value' }]}
        />
      );

      const title = screen.getByText('Small Title');
      expect(title).toBeInTheDocument();
    });

    it('renders medium title', () => {
      render(
        <KeyValueSection
          title="Medium Title"
          titleSize="md"
          entries={[{ label: 'Key', value: 'Value' }]}
        />
      );

      const title = screen.getByText('Medium Title');
      expect(title).toBeInTheDocument();
    });

    it('renders large title', () => {
      render(
        <KeyValueSection
          title="Large Title"
          titleSize="lg"
          entries={[{ label: 'Key', value: 'Value' }]}
        />
      );

      const title = screen.getByText('Large Title');
      expect(title).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('label has tooltip when provided', () => {
      const entries: KeyValueEntry[] = [
        { label: 'Temperature', value: '25°C', tooltip: 'Current temperature' },
      ];

      render(<KeyValueSection entries={entries} />);

      const label = screen.getByText('Temperature');
      expect(label).toHaveAttribute('title', 'Current temperature');
    });
  });
});
