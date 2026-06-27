/**
 * SearchableSelect Stories
 * 
 * Stories for the SearchableSelect component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SearchableSelect } from './SearchableSelect.js';

const meta: Meta<typeof SearchableSelect> = {
  title: 'Primitives/SearchableSelect',
  component: SearchableSelect,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    maxSuggestions: {
      control: 'number',
    },
    clearable: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchableSelect>;

// Sample data
const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Carol White', email: 'carol@example.com' },
  { id: 4, name: 'David Brown', email: 'david@example.com' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com' },
];

export const Default: Story = {
  args: {
    options: fruits,
    placeholder: 'Select a fruit...',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const WithObjectOptions: Story = {
  args: {
    options: users,
    placeholder: 'Select a user...',
    getOptionLabel: (user: User) => user.name,
    getOptionKey: (user: User) => String(user.id),
    onChange: (user: User) => console.log('Selected:', user),
  },
};

export const Clearable: Story = {
  args: {
    options: fruits,
    placeholder: 'Select a fruit...',
    clearable: true,
    onChange: (value) => console.log('Selected:', value),
  },
};

export const Disabled: Story = {
  args: {
    options: fruits,
    placeholder: 'Disabled select...',
    disabled: true,
    onChange: (value) => console.log('Selected:', value),
  },
};

export const Small: Story = {
  args: {
    options: fruits,
    placeholder: 'Small size...',
    size: 'sm',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const Large: Story = {
  args: {
    options: fruits,
    placeholder: 'Large size...',
    size: 'lg',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const LimitedSuggestions: Story = {
  args: {
    options: fruits,
    placeholder: 'Max 3 suggestions...',
    maxSuggestions: 3,
    onChange: (value) => console.log('Selected:', value),
  },
};

export const CustomNoOptionsMessage: Story = {
  args: {
    options: fruits,
    placeholder: 'Type "zzz" to see empty state...',
    noOptionsMessage: 'No matching fruits found. Try another search!',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const PreSelected: Story = {
  args: {
    options: fruits,
    placeholder: 'Select a fruit...',
    value: 'Banana',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const PreSelectedObject: Story = {
  args: {
    options: users,
    placeholder: 'Select a user...',
    value: users[1], // Bob Smith
    getOptionLabel: (user: User) => user.name,
    getOptionKey: (user: User) => String(user.id),
    clearable: true,
    onChange: (user: User) => console.log('Selected:', user),
  },
};

export const KeyboardNavigation: Story = {
  args: {
    options: fruits,
    placeholder: 'Use arrow keys to navigate, Enter to select...',
    onChange: (value) => console.log('Selected:', value),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard Navigation:**
- **ArrowDown** - Open dropdown (if closed) or move highlight to next option
- **ArrowUp** - Move highlight to previous option
- **Enter** - Select highlighted option (or first option if none highlighted)
- **Escape** - Close dropdown without selection
- **Tab** - Select highlighted option and move focus
        `,
      },
    },
  },
};

export const WithRecentOptions: Story = {
  args: {
    options: fruits,
    recentOptions: ['Banana', 'Cherry'],
    placeholder: 'Recent selections appear at top...',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const WithManyRecentOptions: Story = {
  args: {
    options: fruits,
    recentOptions: ['Banana', 'Cherry', 'Date', 'Apple', 'Fig', 'Grape'],
    maxRecentOptions: 3,
    placeholder: 'Limited to 3 recent options...',
    onChange: (value) => console.log('Selected:', value),
  },
};

export const WithHighlighting: Story = {
  args: {
    options: fruits,
    highlightMatches: true,
    placeholder: 'Type to see matching text highlighted...',
    onChange: (value) => console.log('Selected:', value),
  },
  parameters: {
    docs: {
      description: {
        story: 'Type in the input to see matching text in options highlighted with bold styling.',
      },
    },
  },
};

export const WithHighlightingAndRecent: Story = {
  args: {
    options: fruits,
    recentOptions: ['Banana', 'Cherry'],
    highlightMatches: true,
    placeholder: 'Highlighting works in both Recent and All sections...',
    onChange: (value) => console.log('Selected:', value),
  },
};
