import type { Meta, StoryObj } from '@storybook/react';
import { AutoSelectorInput } from './AutoSelectorInput';

const frameworks = [
  { value: 'react', label: 'React', description: 'Meta / Open Source' },
  { value: 'vue', label: 'Vue', description: 'Evan You / Open Source' },
  { value: 'angular', label: 'Angular', description: 'Google' },
  { value: 'svelte', label: 'Svelte', description: 'Rich Harris' },
  { value: 'solid', label: 'SolidJS', description: 'Ryan Carniato' },
];

const grouped = [
  { value: 'ts', label: 'TypeScript', group: 'Typed' },
  { value: 'flow', label: 'Flow', group: 'Typed' },
  { value: 'js', label: 'JavaScript', group: 'Untyped' },
  { value: 'py', label: 'Python', group: 'Untyped' },
];

const meta: Meta<typeof AutoSelectorInput> = {
  title: 'Primitives/AutoSelectorInput',
  component: AutoSelectorInput,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'filled', 'unstyled'] },
  },
};
export default meta;

type Story = StoryObj<typeof AutoSelectorInput>;

export const Default: Story = {
  args: {
    options: frameworks,
    placeholder: 'Search frameworks…',
  },
};

export const FreeSolo: Story = {
  args: {
    options: frameworks,
    freeSolo: true,
    placeholder: 'Pick or type a value',
  },
};

export const MultiSelect: Story = {
  args: {
    options: frameworks,
    multiple: true,
    autoHighlight: true,
    placeholder: 'Select multiple…',
  },
};

export const Grouped: Story = {
  args: {
    options: grouped,
    placeholder: 'Pick a language…',
    autoHighlight: true,
  },
};

export const AsyncLoad: Story = {
  args: {
    loadOptions: async (query: string) => {
      await new Promise((r) => setTimeout(r, 500));
      return frameworks.filter((f) =>
        f.label.toLowerCase().includes(query.toLowerCase())
      );
    },
    placeholder: 'Type to search (async)…',
    debounceMs: 300,
  },
};

export const WithError: Story = {
  args: {
    options: frameworks,
    error: true,
    errorMessage: 'Please select a valid framework.',
    placeholder: 'Framework…',
  },
};

export const SelectOnFocus: Story = {
  args: {
    options: frameworks,
    selectOnFocus: true,
    value: 'react',
    placeholder: 'Click to replace…',
  },
};

export const Disabled: Story = {
  args: {
    options: frameworks,
    disabled: true,
    placeholder: 'Disabled input',
  },
};