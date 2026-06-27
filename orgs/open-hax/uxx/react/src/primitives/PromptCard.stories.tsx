import type { Meta, StoryObj } from '@storybook/react';
import { PromptCard } from './PromptCard';
import type { InputPrompt } from './PermissionPrompts';

const meta: Meta<typeof PromptCard> = {
  title: 'Primitives/PromptCard',
  component: PromptCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PromptCard>;

const samplePrompt: InputPrompt = {
  id: 'prompt-1',
  title: 'Input Required',
  body: { prompt: 'What is the target environment?' },
  placeholder: 'e.g., production, staging',
};

export const Basic: Story = {
  args: {
    prompt: samplePrompt,
    onResponse: () => {},
    autoFocus: false,
  },
};

export const Multiline: Story = {
  args: {
    prompt: {
      ...samplePrompt,
      multiline: true,
      body: 'Provide a detailed deployment note:',
    },
    onResponse: () => {},
    autoFocus: false,
  },
};
