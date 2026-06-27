import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button.js';
import { SurfaceHero } from './SurfaceHero.js';

const meta: Meta<typeof SurfaceHero> = {
  title: 'Primitives/SurfaceHero',
  component: SurfaceHero,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/surface-hero.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SurfaceHero>;

export const Default: Story = {
  args: {
    kicker: 'Host Fleet',
    title: 'Promethean ussy host dashboard',
    description: 'One view for container inventory and routed subdomains across the ussy hosts.',
  },
};

export const WithStats: Story = {
  args: {
    kicker: 'Federation',
    title: 'Brethren control surface',
    description: 'Inspect self-state, peers, projected accounts, and bridge sessions.',
    stats: [
      { label: 'known peers', value: 3, tone: 'info' },
      { label: 'projected', value: 8, tone: 'warning' },
      { label: 'healthy', value: 2, tone: 'success' },
    ],
  },
};

export const WithActions: Story = {
  args: {
    kicker: 'Analytics',
    title: 'Provider + model analytics',
    description: 'Understand routing quality, cost, and observed provider-model pair behavior.',
    stats: [
      { label: 'providers', value: 6, tone: 'info' },
      { label: 'models', value: 42, tone: 'default' },
    ],
    actions: <Button variant="primary">Refresh</Button>,
  },
};
