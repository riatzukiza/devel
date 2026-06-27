import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  describe('rendering', () => {
    it('renders a textarea element', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Textarea placeholder="Enter description" />);
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });

    it('renders with default size (md)', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
    });

    it('renders with default variant (default)', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'default');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Textarea size="sm" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'sm');
    });

    it('renders medium size', () => {
      render(<Textarea size="md" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
    });

    it('renders large size', () => {
      render(<Textarea size="lg" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Textarea variant="default" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'default');
    });

    it('renders filled variant', () => {
      render(<Textarea variant="filled" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'filled');
    });

    it('renders unstyled variant', () => {
      render(<Textarea variant="unstyled" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'unstyled');
    });
  });

  describe('value handling', () => {
    it('renders with value', () => {
      render(<Textarea value="test value" onChange={() => {}} />);
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });

    it('renders with defaultValue', () => {
      render(<Textarea defaultValue="default" />);
      expect(screen.getByDisplayValue('default')).toBeInTheDocument();
    });

    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'hello');
      
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Textarea disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not trigger onChange when disabled', async () => {
      const handleChange = vi.fn();
      render(<Textarea disabled onChange={handleChange} />);
      
      await userEvent.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('readonly state', () => {
    it('can be readonly', () => {
      render(<Textarea readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('does not trigger onChange when readonly', async () => {
      const handleChange = vi.fn();
      render(<Textarea readOnly onChange={handleChange} />);
      
      await userEvent.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('required state', () => {
    it('can be required', () => {
      render(<Textarea required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('error state', () => {
    it('has data-error attribute when error is true', () => {
      render(<Textarea error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-error', 'true');
    });

    it('displays error message when provided', () => {
      render(<Textarea error errorMessage="Description is required" />);
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('does not display error message when error is false', () => {
      render(<Textarea errorMessage="Description is required" />);
      expect(screen.queryByText('Description is required')).not.toBeInTheDocument();
    });
  });

  describe('attributes', () => {
    it('can have a name', () => {
      render(<Textarea name="description" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
    });

    it('can have an id', () => {
      render(<Textarea id="description-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'description-input');
    });

    it('can have rows', () => {
      render(<Textarea rows={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    it('can have cols', () => {
      render(<Textarea cols={40} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('cols', '40');
    });

    it('can have maxLength', () => {
      render(<Textarea maxLength={100} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '100');
    });

    it('can have minLength', () => {
      render(<Textarea minLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '10');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = { current: null as HTMLTextAreaElement | null };
      render(<Textarea ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe('accessibility', () => {
    it('has textbox role', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports aria attributes', () => {
      render(<Textarea aria-label="Description" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });
});
