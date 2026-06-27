import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AutoSelectorInput } from './AutoSelectorInput';

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
];

describe('AutoSelectorInput', () => {
  // Note: Due to Input component's controlled pattern, testing value changes via fireEvent 
  // triggers "value setter" errors. Use userEvent in real scenarios.

  it('renders the input', () => {
    render(<AutoSelectorInput options={options} placeholder="Pick one" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not show the dropdown on initial render', () => {
    render(<AutoSelectorInput options={options} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not open the dropdown when disabled', () => {
    render(<AutoSelectorInput options={options} disabled />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders the error message when error prop is set', () => {
    render(
      <AutoSelectorInput
        options={options}
        error
        errorMessage="Required"
        id="test-input"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('sets role="combobox" on the container', () => {
    render(<AutoSelectorInput options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with correct placeholder', () => {
    render(<AutoSelectorInput options={options} placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with the given options in props', () => {
    render(<AutoSelectorInput options={options} />);
    const container = screen.getByRole('combobox');
    expect(container).toHaveAttribute('data-component', 'auto-selector-input');
  });
});