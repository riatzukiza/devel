import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with default size (md)', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
    });

    it('renders with default variant (default)', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'default');
    });

    it('renders with default type (text)', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });
  });

  describe('types', () => {
    it('renders text input', () => {
      render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders password input', () => {
      render(<Input type="password" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
    });

    it('renders email input', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders number input', () => {
      render(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('renders search input', () => {
      render(<Input type="search" />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
    });

    it('renders url input', () => {
      render(<Input type="url" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'url');
    });

    it('renders tel input', () => {
      render(<Input type="tel" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Input size="sm" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'sm');
    });

    it('renders medium size', () => {
      render(<Input size="md" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
    });

    it('renders large size', () => {
      render(<Input size="lg" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Input variant="default" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'default');
    });

    it('renders filled variant', () => {
      render(<Input variant="filled" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'filled');
    });

    it('renders unstyled variant', () => {
      render(<Input variant="unstyled" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-variant', 'unstyled');
    });
  });

  describe('value handling', () => {
    it('renders with value', () => {
      render(<Input value="test value" onChange={() => {}} />);
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });

    it('renders with defaultValue', () => {
      render(<Input defaultValue="default" />);
      expect(screen.getByDisplayValue('default')).toBeInTheDocument();
    });

    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('has data-disabled attribute when disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-disabled', 'true');
    });

    it('does not trigger onChange when disabled', async () => {
      const handleChange = vi.fn();
      render(<Input disabled onChange={handleChange} />);
      
      await userEvent.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('readonly state', () => {
    it('can be readonly', () => {
      render(<Input readonly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('does not trigger onChange when readonly', async () => {
      const handleChange = vi.fn();
      render(<Input readonly onChange={handleChange} />);
      
      await userEvent.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('required state', () => {
    it('can be required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('error state', () => {
    it('has data-error attribute when error is true', () => {
      render(<Input error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-error', 'true');
    });

    it('sets aria-invalid when error is true', () => {
      render(<Input error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('displays error message when provided', () => {
      render(<Input error errorMessage="Invalid input" id="test-input" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid input');
    });

    it('does not display error message when error is false', () => {
      render(<Input errorMessage="Invalid input" id="test-input" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('links error message to input via aria-describedby', () => {
      render(<Input error errorMessage="Invalid input" id="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });
  });

  describe('icons', () => {
    it('renders left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">🔍</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders both icons', () => {
      render(
        <Input 
          leftIcon={<span data-testid="left-icon">🔍</span>} 
          rightIcon={<span data-testid="right-icon">✓</span>} 
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('does not render icons in unstyled variant', () => {
      render(
        <Input 
          variant="unstyled"
          leftIcon={<span data-testid="left-icon">🔍</span>} 
          rightIcon={<span data-testid="right-icon">✓</span>} 
        />
      );
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('focus handling', () => {
    it('calls onFocus when focused', async () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      
      await userEvent.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when blurred', async () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab(); // Move focus away
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('attributes', () => {
    it('can have a name', () => {
      render(<Input name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('can have an id', () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
    });

    it('can have autoComplete', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });

    it('can have maxLength', () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
    });

    it('can have minLength', () => {
      render(<Input minLength={3} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '3');
    });

    it('can have pattern', () => {
      render(<Input pattern="[0-9]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*');
    });

    it('can have autoFocus', () => {
      render(<Input autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('accessibility', () => {
    it('has textbox role by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('has aria-invalid when error is true', () => {
      render(<Input error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('error message has role="alert"', () => {
      render(<Input error errorMessage="Error" id="test" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
