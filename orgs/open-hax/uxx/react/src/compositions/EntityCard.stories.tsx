/**
 * EntityCard Stories
 *
 * Storybook stories for the EntityCard composition component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EntityCard } from './EntityCard.js';

const meta: Meta<typeof EntityCard> = {
  title: 'Compositions/EntityCard',
  component: EntityCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated', 'gradient'],
    },
    interactive: {
      control: 'boolean',
    },
    dividers: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EntityCard>;

// Basic entity card
export const Basic: Story = {
  args: {
    id: 'agent-1',
    name: 'Agent Alpha',
    type: 'Agent',
    status: {
      value: 'Alive',
      variant: 'alive',
    },
    metadata: [
      { label: 'Position', value: '(-10, 20)' },
      { label: 'Role', value: 'Worker' },
      { label: 'Mood', value: '72%' },
    ],
  },
};

// With image
export const WithImage: Story = {
  args: {
    id: 'actor-1',
    name: 'GPT-4 Actor',
    type: 'LLM Actor',
    status: {
      value: 'Running',
      variant: 'running',
    },
    image: {
      src: 'https://api.dicebear.com/7.x/bottts/svg?seed=gpt4',
      alt: 'GPT-4 Avatar',
      size: 'lg',
    },
    metadata: [
      { label: 'Model', value: 'gpt-4-turbo' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Total Ticks', value: '1,247' },
    ],
    primaryAction: {
      label: 'View Details',
      onClick: () => console.log('View details'),
    },
  },
};

// With tags
export const WithTags: Story = {
  args: {
    id: 'issue-42',
    name: 'Issue #42',
    type: 'Fix memory leak in worker threads',
    status: {
      value: 'Open',
      variant: 'open',
    },
    tags: ['bug', 'performance', 'high-priority'],
    metadata: [
      { label: 'Author', value: 'alice' },
      { label: 'Created', value: '2 days ago' },
    ],
    primaryAction: {
      label: 'Create Worktree',
      onClick: () => console.log('Create worktree'),
    },
    secondaryActions: [
      { label: 'Open PR', onClick: () => console.log('Open PR') },
    ],
  },
};

// Interactive card
export const Interactive: Story = {
  args: {
    id: 'interactive-1',
    name: 'Interactive Card',
    type: 'Click me!',
    status: {
      value: 'Active',
      variant: 'alive',
    },
    interactive: true,
    onClick: () => alert('Card clicked!'),
    metadata: [
      { label: 'Status', value: 'Ready' },
      { label: 'Last Updated', value: 'Just now' },
    ],
    primaryAction: {
      label: 'Action',
      onClick: () => alert('Action clicked (propagation stopped)'),
    },
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <EntityCard
        id="variant-default"
        name="Default Variant"
        type="Standard border, surface background"
        status={{ value: 'Default', variant: 'default' }}
        variant="default"
      />
      <EntityCard
        id="variant-outlined"
        name="Outlined Variant"
        type="Border only, transparent background"
        status={{ value: 'Outlined', variant: 'default' }}
        variant="outlined"
      />
      <EntityCard
        id="variant-elevated"
        name="Elevated Variant"
        type="Shadow, elevated background"
        status={{ value: 'Elevated', variant: 'info' }}
        variant="elevated"
      />
      <EntityCard
        id="variant-gradient"
        name="Gradient Variant"
        type="Custom gradient background"
        status={{ value: 'Gradient', variant: 'success' }}
        variant="gradient"
        gradient="linear-gradient(135deg, rgba(102,217,239,0.2), rgba(166,226,46,0.2))"
        metadata={[
          { label: 'Continuity', value: '42%' },
          { label: 'Linked', value: '3 entities' },
        ]}
      />
    </div>
  ),
};

// With all features
export const Complete: Story = {
  args: {
    id: 'complete-1',
    name: 'Complete Entity',
    type: 'Full-featured Card',
    status: {
      value: 'Running',
      variant: 'running',
    },
    image: {
      src: 'https://api.dicebear.com/7.x/bottts/svg?seed=complete',
      alt: 'Complete Entity Avatar',
      size: 'md',
    },
    metadata: [
      { label: 'Position', value: '(10, 20)' },
      { label: 'Role', value: 'Worker' },
      { label: 'Mood', value: '85%' },
      { label: 'Health', value: '100%' },
    ],
    tags: ['active', 'priority', 'assigned'],
    primaryAction: {
      label: 'View Details',
      onClick: () => console.log('View details'),
    },
    secondaryActions: [
      { label: 'Edit', onClick: () => console.log('Edit') },
      { label: 'Delete', onClick: () => console.log('Delete') },
    ],
    interactive: true,
    onClick: () => console.log('Card clicked'),
  },
};

// Custom header/footer
export const CustomSections: Story = {
  args: {
    id: 'custom-1',
    name: 'Custom Sections',
    header: (
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <strong>Custom Header</strong>
        <span style={{ color: '#888' }}>Custom subtitle</span>
      </div>
    ),
    footer: (
      <div style={{ padding: '12px 16px', borderTop: '1px solid #333' }}>
        <em>Custom Footer Content</em>
      </div>
    ),
  },
};

// Minimal card
export const Minimal: Story = {
  args: {
    id: 'minimal-1',
    name: 'Minimal Card',
  },
};

// Status variants
export const StatusVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <EntityCard
        id="status-alive"
        name="Alive Entity"
        status={{ value: 'Alive', variant: 'alive' }}
      />
      <EntityCard
        id="status-dead"
        name="Dead Entity"
        status={{ value: 'Dead', variant: 'dead' }}
      />
      <EntityCard
        id="status-running"
        name="Running Process"
        status={{ value: 'Running', variant: 'running' }}
      />
      <EntityCard
        id="status-stopped"
        name="Stopped Process"
        status={{ value: 'Stopped', variant: 'stopped' }}
      />
      <EntityCard
        id="status-open"
        name="Open Issue"
        status={{ value: 'Open', variant: 'open' }}
      />
      <EntityCard
        id="status-closed"
        name="Closed Issue"
        status={{ value: 'Closed', variant: 'closed' }}
      />
      <EntityCard
        id="status-merged"
        name="Merged PR"
        status={{ value: 'Merged', variant: 'merged' }}
      />
    </div>
  ),
};

// Without dividers
export const NoDividers: Story = {
  args: {
    id: 'no-dividers',
    name: 'No Dividers',
    status: {
      value: 'Active',
      variant: 'alive',
    },
    image: {
      src: 'https://api.dicebear.com/7.x/bottts/svg?seed=nodevider',
      size: 'sm',
    },
    metadata: [
      { label: 'Field 1', value: 'Value 1' },
      { label: 'Field 2', value: 'Value 2' },
    ],
    tags: ['tag1', 'tag2'],
    dividers: false,
  },
};

// Gradient examples
export const GradientExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <EntityCard
        id="gradient-1"
        name="Monokai Gradient"
        variant="gradient"
        gradient="linear-gradient(135deg, rgba(102,217,239,0.3), rgba(166,226,46,0.2))"
        metadata={[
          { label: 'Style', value: 'Cyan to Green' },
        ]}
      />
      <EntityCard
        id="gradient-2"
        name="Warm Gradient"
        variant="gradient"
        gradient="linear-gradient(135deg, rgba(253,151,31,0.3), rgba(242,119,122,0.2))"
        metadata={[
          { label: 'Style', value: 'Orange to Pink' },
        ]}
      />
      <EntityCard
        id="gradient-3"
        name="Cool Gradient"
        variant="gradient"
        gradient="linear-gradient(135deg, rgba(102,217,239,0.2), rgba(174,129,255,0.3))"
        metadata={[
          { label: 'Style', value: 'Cyan to Purple' },
        ]}
      />
    </div>
  ),
};

// Corpus examples
export const CorpusExampleAgent: Story = {
  name: 'Corpus: Agent Card (Gates of Aker)',
  args: {
    id: 'agent-corpus',
    name: 'Agent Alpha',
    type: 'Agent',
    status: {
      value: 'Alive',
      variant: 'alive',
    },
    image: {
      src: 'https://api.dicebear.com/7.x/bottts/svg?seed=agent-alpha',
      size: 'lg',
    },
    metadata: [
      { label: 'Position', value: '(-10, 20)' },
      { label: 'Role', value: 'Worker' },
      { label: 'Mood', value: '72%' },
      { label: 'Energy', value: '85%' },
    ],
    primaryAction: {
      label: 'View Details',
      onClick: () => console.log('View agent'),
    },
    secondaryActions: [
      { label: 'Give Task', onClick: () => console.log('Give task') },
    ],
  },
};

export const CorpusExampleIssue: Story = {
  name: 'Corpus: Issue Card (OpenHax)',
  args: {
    id: 'issue-151',
    name: 'Issue #151',
    type: 'Add keyboard navigation to dropdown',
    status: {
      value: 'Open',
      variant: 'open',
    },
    tags: ['enhancement', 'ui', 'accessibility'],
    metadata: [
      { label: 'Author', value: 'alice' },
      { label: 'Created', value: '3 days ago' },
      { label: 'Comments', value: '5' },
    ],
    primaryAction: {
      label: 'Create Worktree',
      onClick: () => console.log('Create worktree'),
    },
    secondaryActions: [
      { label: 'Open PR', onClick: () => console.log('Open PR') },
    ],
    interactive: true,
    onClick: () => console.log('Navigate to issue'),
  },
};

export const CorpusExampleActor: Story = {
  name: 'Corpus: Actor Card (Promethean)',
  args: {
    id: 'actor-corpus',
    name: 'claude-3-opus',
    type: 'LLM Actor',
    status: {
      value: 'Running',
      variant: 'running',
    },
    image: {
      src: 'https://api.dicebear.com/7.x/bottts/svg?seed=claude',
      size: 'md',
    },
    metadata: [
      { label: 'Model', value: 'claude-3-opus-20240229' },
      { label: 'Temperature', value: '0.8' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Total Ticks', value: '2,847' },
    ],
    primaryAction: {
      label: 'View Logs',
      onClick: () => console.log('View logs'),
    },
    secondaryActions: [
      { label: 'Pause', onClick: () => console.log('Pause') },
      { label: 'Stop', onClick: () => console.log('Stop') },
    ],
    variant: 'elevated',
  },
};
