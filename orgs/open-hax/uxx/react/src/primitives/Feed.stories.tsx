import type { Meta, StoryObj } from '@storybook/react';
import { Feed, type FeedItem } from './Feed';

const meta: Meta<typeof Feed> = {
  title: 'KMS IDE/Feed',
  component: Feed,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/feed.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Feed>;

const sampleItems: FeedItem[] = [
  {
    id: '1',
    type: 'agent',
    title: 'Agent completed task',
    content: 'Successfully refactored the authentication module. All tests pass.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    author: { name: 'Claude', role: 'agent' },
    badge: 'success',
    actions: ['View Changes', 'Rollback'],
  },
  {
    id: '2',
    type: 'commit',
    title: 'New commit pushed',
    content: 'feat: Add user preferences panel',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    author: { name: 'Alice Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    badge: 'main',
    file: {
      name: 'preferences.tsx',
      path: 'src/components/settings/',
      status: 'added',
    },
    diff: { additions: 156, deletions: 0 },
  },
  {
    id: '3',
    type: 'file',
    title: 'File modified',
    content: 'Updated API endpoint configuration',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    author: { name: 'Bob Martinez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    file: {
      name: 'api.config.ts',
      path: 'src/config/',
      status: 'modified',
    },
    diff: { additions: 12, deletions: 5 },
  },
  {
    id: '4',
    type: 'message',
    content: 'Can you review the new authentication flow? I want to make sure we handle all edge cases.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    author: { name: 'Carol Davis', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol' },
    read: false,
  },
  {
    id: '5',
    type: 'system',
    title: 'Deployment completed',
    content: 'Production deployment v2.3.1 finished successfully. All services are healthy.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    badge: 'production',
  },
  {
    id: '6',
    type: 'notification',
    title: 'Security alert',
    content: 'New login detected from unrecognized device in Berlin, Germany.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    badge: 'alert',
    actions: ['Review', 'Dismiss'],
    read: false,
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    variant: 'timeline',
    groupBy: 'date',
  },
};

export const Cards: Story = {
  args: {
    items: sampleItems,
    variant: 'cards',
    groupBy: 'none',
  },
};

export const List: Story = {
  args: {
    items: sampleItems,
    variant: 'list',
    groupBy: 'none',
  },
};

export const Compact: Story = {
  args: {
    items: sampleItems,
    variant: 'compact',
    groupBy: 'date',
  },
};

export const GroupByAgent: Story = {
  args: {
    items: sampleItems,
    variant: 'list',
    groupBy: 'agent',
  },
};

export const WithLoadMore: Story = {
  args: {
    items: sampleItems.slice(0, 3),
    variant: 'timeline',
    infiniteScroll: true,
    onLoadMore: () => console.log('Loading more...'),
  },
};

export const WithActions: Story = {
  args: {
    items: sampleItems.filter((item) => item.actions && item.actions.length > 0),
    variant: 'cards',
    groupBy: 'none',
    onItemAction: (action, item) => console.log(`Action: ${action}`, item),
  },
};

export const EmptyState: Story = {
  args: {
    items: [],
    emptyState: (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No activity yet</div>
        <div style={{ color: '#75715e' }}>Activity will appear here as you work</div>
      </div>
    ),
  },
};

export const WithFileChanges: Story = {
  args: {
    items: sampleItems.filter((item) => item.file),
    variant: 'list',
    groupBy: 'none',
  },
};

export const UnreadOnly: Story = {
  args: {
    items: sampleItems.filter((item) => !item.read),
    variant: 'timeline',
    groupBy: 'none',
  },
};
