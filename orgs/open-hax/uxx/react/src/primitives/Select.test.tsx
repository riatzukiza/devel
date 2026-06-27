import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const defaultOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('Select', () => {
  describe('rendering', () => {
    it('renders a select element', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders options', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cherry' })).toBeInTheDocument();
    });

    it('renders with default size (md)', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'md');
    });

    it('renders with default variant (default)', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-variant', 'default');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Select size="sm" options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm');
    });

    it('renders medium size', () => {
      render(<Select size="md" options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'md');
    });

    it('renders large size', () => {
      render(<Select size="lg" options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Select variant="default" options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-variant', 'default');
    });

    it('renders filled variant', () => {
      render(<Select variant="filled" options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-variant', 'filled');
    });

    it('renders unstyled variant', () => {
      render(<Select variant="unstyled" options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-variant', 'unstyled');
    });
  });

  describe('placeholder', () => {
    it('renders placeholder option', () => {
      render(<Select options={defaultOptions} placeholder="Select fruit..." />);
      expect(screen.getByRole('option', { name: 'Select fruit...' })).toBeInTheDocument();
    });

    it('placeholder option is disabled', () => {
      render(<Select options={defaultOptions} placeholder="Select fruit..." />);
      const placeholder = screen.getByRole('option', { name: 'Select fruit...' });
      expect(placeholder).toBeDisabled();
    });
  });

  describe('value handling', () => {
    it('renders with value', () => {
      render(<Select options={defaultOptions} value="banana" onChange={() => {}} />);
      expect(screen.getByDisplayValue('Banana')).toBeInTheDocument();
    });

    it('calls onChange when selection changes', async () => {
      const handleChange = vi.fn();
      render(<Select options={defaultOptions} onChange={handleChange} />);
      
      await userEvent.selectOptions(screen.getByRole('combobox'), 'banana');
      
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Select options={defaultOptions} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('does not trigger onChange when disabled', async () => {
      const handleChange = vi.fn();
      render(<Select options={defaultOptions} disabled onChange={handleChange} />);
      
      await userEvent.selectOptions(screen.getByRole('combobox'), 'banana');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled options', () => {
    it('renders disabled options', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana', disabled: true },
      ];
      render(<Select options={options} />);
      
      const bananaOption = screen.getByRole('option', { name: 'Banana' });
      expect(bananaOption).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('has data-error attribute when error is true', () => {
      render(<Select options={defaultOptions} error />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-error', 'true');
    });

    it('displays error message when provided', () => {
      render(<Select options={defaultOptions} error errorMessage="Please select an option" />);
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('does not display error message when error is false', () => {
      render(<Select options={defaultOptions} errorMessage="Please select an option" />);
      expect(screen.queryByText('Please select an option')).not.toBeInTheDocument();
    });
  });

  describe('children', () => {
    it('renders children as additional options', () => {
      render(
        <Select options={defaultOptions}>
          <option value="date">Date</option>
        </Select>
      );
      
      expect(screen.getByRole('option', { name: 'Date' })).toBeInTheDocument();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to select element', () => {
      const ref = { current: null as HTMLSelectElement | null };
      render(<Select ref={ref} options={defaultOptions} />);
      
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('accessibility', () => {
    it('has combobox role', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('options have option role', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });
  });
});
