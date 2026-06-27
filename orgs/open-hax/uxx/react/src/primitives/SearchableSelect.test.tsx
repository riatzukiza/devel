/**
 * SearchableSelect Tests
 * 
 * Unit tests for the SearchableSelect component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableSelect } from './SearchableSelect.js';

describe('SearchableSelect', () => {
  const defaultOptions = ['Apple', 'Banana', 'Cherry', 'Date'];

  describe('rendering', () => {
    it('renders input with placeholder', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          placeholder="Select fruit..."
          onChange={() => {}}
        />
      );

      expect(screen.getByPlaceholderText('Select fruit...')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          value="Banana"
          onChange={() => {}}
        />
      );

      expect(screen.getByDisplayValue('Banana')).toBeInTheDocument();
    });

    it('renders as disabled', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          disabled
          onChange={() => {}}
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeDisabled();
    });

    it('renders clear button when clearable and has value', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          value="Apple"
          clearable
          onChange={() => {}}
        />
      );

      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
    });

    it('does not render clear button when no value', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          clearable
          onChange={() => {}}
        />
      );

      expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument();
    });
  });

  describe('dropdown behavior', () => {
    it('shows dropdown on focus', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      // Click to focus (more reliable than fireEvent.focus)
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('hides dropdown on blur', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('filters options by input', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'App');

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent('Apple');
      });
    });

    it('shows empty state when no matches', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          noOptionsMessage="No fruits found"
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'zzz');

      await waitFor(() => {
        expect(screen.getByText('No fruits found')).toBeInTheDocument();
      });
    });

    it('limits suggestions by maxSuggestions', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          maxSuggestions={2}
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
      });
    });
  });

  describe('selection', () => {
    it('selects option on click', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByText('Banana');
      fireEvent.click(option);

      expect(handleChange).toHaveBeenCalledWith('Banana');
    });

    it('closes dropdown after selection', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByText('Banana');
      fireEvent.click(option);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('clears value on clear button click', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          value="Apple"
          clearable
          onChange={() => {}}
        />
      );

      const clearButton = screen.getByLabelText('Clear selection');
      fireEvent.click(clearButton);

      expect(screen.getByPlaceholderText('Search...')).toHaveValue('');
    });
  });

  describe('object options', () => {
    interface User {
      id: number;
      name: string;
    }

    const users: User[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];

    it('renders object options with getOptionLabel', async () => {
      render(
        <SearchableSelect 
          options={users}
          getOptionLabel={(user) => user.name}
          getOptionKey={(user) => String(user.id)}
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
      });
    });

    it('selects object option on click', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={users}
          getOptionLabel={(user) => user.name}
          getOptionKey={(user) => String(user.id)}
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByText('Bob');
      fireEvent.click(option);

      expect(handleChange).toHaveBeenCalledWith({ id: 2, name: 'Bob' });
    });

    it('filters object options by label', async () => {
      render(
        <SearchableSelect 
          options={users}
          getOptionLabel={(user) => user.name}
          getOptionKey={(user) => String(user.id)}
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'Ali');

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent('Alice');
      });
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on ArrowDown when closed', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('highlights next option on ArrowDown', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await userEvent.keyboard('{ArrowDown}');

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // Check first option has highlight style (background or outline)
        const firstOptionStyle = options[0].getAttribute('style') || '';
        expect(firstOptionStyle).toMatch(/background|outline/);
      });
    });

    it('highlights previous option on ArrowUp', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Move down twice
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Move up once
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[1]).toHaveStyle({ outline: expect.stringContaining('2px') });
      });
    });

    it('does not wrap at boundaries', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Try to go up from first position
      await userEvent.keyboard('{ArrowUp}');

      // Should stay at -1 (no highlight)
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const firstOptionStyle = options[0].getAttribute('style') || '';
        expect(firstOptionStyle).not.toMatch(/outline.*2px/);
      });

      // Go down to first
      await userEvent.keyboard('{ArrowDown}');

      // Go past last
      for (let i = 0; i < defaultOptions.length + 2; i++) {
        await userEvent.keyboard('{ArrowDown}');
      }

      // Should stay at last option (not wrap)
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const lastOptionStyle = options[options.length - 1].getAttribute('style') || '';
        expect(lastOptionStyle).toMatch(/background|outline/);
      });
    });

    it('selects highlighted option on Enter', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleChange).toHaveBeenCalledWith('Banana');
    });

    it('selects first option on Enter when none highlighted', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleChange).toHaveBeenCalledWith('Apple');
    });

    it('closes dropdown on Escape without selection', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('selects and moves focus on Tab', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(handleChange).toHaveBeenCalledWith('Banana');
    });

    it('resets highlight when filter changes', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Highlight second option
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const activedescendant = input.getAttribute('aria-activedescendant');
      expect(activedescendant).toBeTruthy();
      expect(activedescendant).toContain('option-');

      // Type to filter
      await userEvent.type(input, 'App');

      // After typing, the dropdown should show filtered results
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeLessThan(4);
      });
    });

    it('updates aria-activedescendant during navigation', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // aria-activedescendant should point to an option (contains "option-0")
      const activedescendant = input.getAttribute('aria-activedescendant');
      expect(activedescendant).toBeTruthy();
      expect(activedescendant).toContain('option-0');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const activedescendant2 = input.getAttribute('aria-activedescendant');
      expect(activedescendant2).toBeTruthy();
      expect(activedescendant2).toContain('option-1');
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          placeholder="Select fruit..."
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Select fruit...');
      const combobox = input.closest('[role="combobox"]');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      const combobox = input.closest('[role="combobox"]');
      await userEvent.click(input);

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('marks selected option with aria-selected', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          value="Banana"
          onChange={() => {}}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        const selectedOption = screen.getByRole('option', { selected: true });
        expect(selectedOption).toHaveTextContent('Banana');
      });
    });

    it('has aria-autocomplete on input', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('has aria-controls pointing to listbox when open', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        const controlsId = input.getAttribute('aria-controls');
        expect(controlsId).toBe(listbox.id);
      });
    });

    it('has aria-activedescendant pointing to highlighted option', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        const activeDescendantId = input.getAttribute('aria-activedescendant');
        expect(activeDescendantId).toBeDefined();
        
        const highlightedOption = screen.getAllByRole('option')[0];
        expect(highlightedOption.id).toBe(activeDescendantId);
      });
    });

    it('announces option count when dropdown opens', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/option/i);
      });
    });

    it('announces selection', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/selected/i);
      });
    });

    it('supports custom aria-label', () => {
      render(
        <SearchableSelect 
          options={defaultOptions} 
          ariaLabel="Choose a fruit from the list"
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('aria-label', 'Choose a fruit from the list');
    });

    it('supports aria-describedby', () => {
      render(
        <div>
          <span id="help-text">Type to search fruits</span>
          <SearchableSelect 
            options={defaultOptions} 
            ariaDescribedBy="help-text"
            onChange={() => {}}
          />
        </div>
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });
  });

  describe('recent options', () => {
    it('shows recent options section when provided', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          recentOptions={['Banana', 'Cherry']}
          onChange={() => {}}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        expect(screen.getByText('Recent')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
        expect(screen.getByText('Cherry')).toBeInTheDocument();
      });
    });

    it('limits recent options to maxRecentOptions', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          recentOptions={['Apple', 'Banana', 'Cherry', 'Date']}
          maxRecentOptions={2}
          onChange={() => {}}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        // Recent section should be present
        expect(screen.getByText('Recent')).toBeInTheDocument();
        // Apple and Banana should be in recent (limited to 2)
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
      });

      // Verify Cherry and Date are NOT in the recent section by checking
      // that they appear after the divider (as regular options)
      const dropdown = screen.getByRole('listbox');
      const allOptions = dropdown?.querySelectorAll('[role="option"]');
      // Total: 2 recent + 2 regular (Cherry, Date) = 4
      expect(allOptions?.length).toBe(4);
    });

    it('filters recent options', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          recentOptions={['Banana', 'Cherry']}
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'Ban');

      await waitFor(() => {
        expect(screen.getByText('Recent')).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(1);
        expect(options[0]).toHaveTextContent('Banana');
      });
    });

    it('hides recent section when no matches', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          recentOptions={['Banana', 'Cherry']}
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'zzz');

      await waitFor(() => {
        expect(screen.queryByText('Recent')).not.toBeInTheDocument();
      });
    });

    it('does not duplicate options between recent and all', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          recentOptions={['Banana']}
          onChange={() => {}}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        const allBananas = screen.getAllByText('Banana');
        expect(allBananas.length).toBe(1);
      });
    });

    it('selects recent option on click', async () => {
      const handleChange = vi.fn();
      render(
        <SearchableSelect 
          options={defaultOptions}
          recentOptions={['Banana']}
          onChange={handleChange}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByText('Banana');
      fireEvent.click(option);

      expect(handleChange).toHaveBeenCalledWith('Banana');
    });
  });

  describe('text highlighting', () => {
    it('highlights matching text when enabled', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          highlightMatches
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'App');

      await waitFor(() => {
        const option = screen.getByRole('option');
        const strong = option.querySelector('strong');
        expect(strong).toBeInTheDocument();
        expect(strong).toHaveTextContent('App');
      });
    });

    it('does not highlight when disabled', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          highlightMatches={false}
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'App');

      await waitFor(() => {
        const option = screen.getByRole('option');
        expect(option.querySelector('strong')).not.toBeInTheDocument();
      });
    });

    it('highlighting is case-insensitive', async () => {
      render(
        <SearchableSelect 
          options={['APPLE', 'banana']}
          highlightMatches
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'app');

      await waitFor(() => {
        const option = screen.getByRole('option');
        const strong = option.querySelector('strong');
        expect(strong).toBeInTheDocument();
        expect(strong).toHaveTextContent('APP');
      });
    });

    it('no highlight when input is empty', async () => {
      render(
        <SearchableSelect 
          options={defaultOptions}
          highlightMatches
          onChange={() => {}}
        />
      );

      await userEvent.click(screen.getByPlaceholderText('Search...'));

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        options.forEach(option => {
          expect(option.querySelector('strong')).not.toBeInTheDocument();
        });
      });
    });

    it('works with object options', async () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      render(
        <SearchableSelect 
          options={users}
          getOptionLabel={(user) => user.name}
          getOptionKey={(user) => String(user.id)}
          highlightMatches
          onChange={() => {}}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      await userEvent.click(input);
      
      await userEvent.type(input, 'Ali');

      await waitFor(() => {
        const option = screen.getByRole('option');
        const strong = option.querySelector('strong');
        expect(strong).toBeInTheDocument();
        expect(strong).toHaveTextContent('Ali');
      });
    });
  });
});
