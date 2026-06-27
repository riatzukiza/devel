import type { Meta, StoryObj } from '@storybook/react';

import { MetricTile } from './MetricTile.js';
import { MetricTileGrid } from './MetricTileGrid.js';

const meta: Meta<typeof MetricTile> = {
  title: 'Primitives/MetricTile',
  component: MetricTile,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/metric-tile.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MetricTile>;

export const Default: Story = {
  args: {
    label: 'Observed Providers',
    value: 12,
    detail: 'Top provider: openai',
  },
};

export const Loading: Story = {
  args: {
    label: 'Tokens / 24h',
    value: 0,
    detail: 'Refreshing sample…',
    loading: true,
  },
};

export const Variants: Story = {
  render: () => (
    <MetricTileGrid>
      <MetricTile label="Default" value={42} detail="neutral" />
      <MetricTile label="Info" value={12} detail="observed" variant="info" />
      <MetricTile label="Success" value="98%" detail="healthy" variant="success" />
      <MetricTile label="Warning" value="21%" detail="degraded" variant="warning" />
      <MetricTile label="Error" value="3.2%" detail="error rate" variant="error" />
    </MetricTileGrid>
  ),
};
