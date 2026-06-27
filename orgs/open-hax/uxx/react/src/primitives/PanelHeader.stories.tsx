import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button.js';
import { Input } from './Input.js';
import { PanelHeader } from './PanelHeader.js';

const meta: Meta<typeof PanelHeader> = {
  title: 'Primitives/PanelHeader',
  component: PanelHeader,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/panel-header.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PanelHeader>;

export const Default: Story = {
  args: {
    title: 'Global Model Stats',
    description: 'How each model performs across all observed providers.',
  },
};

export const WithKickerAndActions: Story = {
  args: {
    kicker: 'Analytics Views',
    title: 'Data Explorer',
    description: 'Switch between model, provider, and pair-level views.',
    actions: (
      <>
        <Input placeholder="Search models…" />
        <Button variant="secondary">Refresh</Button>
      </>
    ),
  },
};
