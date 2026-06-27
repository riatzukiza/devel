import type { Meta, StoryObj } from '@storybook/react';
import { CommandPalette, type CommandItem } from './CommandPalette';
import { useState } from 'react';

const meta: Meta<typeof CommandPalette> = {
  title: 'AI IDE/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/command-palette.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

const sampleItems: CommandItem[] = [
  { id: 'new-file', label: 'New File', shortcut: '⌘N', category: 'File' },
  { id: 'open-file', label: 'Open File', shortcut: '⌘O', category: 'File' },
  { id: 'save', label: 'Save', shortcut: '⌘S', category: 'File' },
  { id: 'save-as', label: 'Save As...', shortcut: '⌘⇧S', category: 'File' },
  { id: 'close', label: 'Close Tab', shortcut: '⌘W', category: 'View' },
  { id: 'search', label: 'Search in Files', shortcut: '⌘⇧F', category: 'Search' },
  { id: 'replace', label: 'Find and Replace', shortcut: '⌘⇧H', category: 'Search' },
  { id: 'terminal', label: 'Toggle Terminal', shortcut: '⌘`', category: 'View' },
  { id: 'sidebar', label: 'Toggle Sidebar', shortcut: '⌘B', category: 'View' },
  { id: 'settings', label: 'Open Settings', shortcut: '⌘,', category: 'Preferences' },
  { id: 'extensions', label: 'Manage Extensions', category: 'Preferences' },
  { id: 'git-commit', label: 'Git: Commit', shortcut: '⌘⇧G', category: 'Git' },
  { id: 'git-push', label: 'Git: Push', category: 'Git' },
  { id: 'git-pull', label: 'Git: Pull', category: 'Git' },
  { id: 'format', label: 'Format Document', shortcut: '⌥⇧F', category: 'Editor' },
  { id: 'rename', label: 'Rename Symbol', shortcut: 'F2', category: 'Editor' },
];

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    
    return (
      <div>
        <button onClick={() => setOpen(true)}>Open Command Palette</button>
        <CommandPalette
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(item) => {
            console.log('Selected:', item);
            setOpen(false);
          }}
          items={sampleItems}
        />
      </div>
    );
  },
};

export const WithGroups: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    
    return (
      <div>
        <button onClick={() => setOpen(true)}>Open Command Palette</button>
        <CommandPalette
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(item) => {
            console.log('Selected:', item);
            setOpen(false);
          }}
          groups={[
            { id: 'file', label: 'File', items: sampleItems.filter(i => i.category === 'File') },
            { id: 'edit', label: 'Edit', items: sampleItems.filter(i => i.category === 'Editor') },
            { id: 'view', label: 'View', items: sampleItems.filter(i => i.category === 'View') },
            { id: 'search', label: 'Search', items: sampleItems.filter(i => i.category === 'Search') },
            { id: 'git', label: 'Git', items: sampleItems.filter(i => i.category === 'Git') },
          ]}
        />
      </div>
    );
  },
};

export const WithRecentItems: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    
    return (
      <div>
        <button onClick={() => setOpen(true)}>Open Command Palette</button>
        <CommandPalette
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(item) => {
            console.log('Selected:', item);
            setOpen(false);
          }}
          items={sampleItems}
          recentItems={[
            { id: 'recent-1', label: 'Recent: Format Document' },
            { id: 'recent-2', label: 'Recent: Toggle Terminal' },
          ]}
        />
      </div>
    );
  },
};

export const WithEmptyState: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    
    return (
      <div>
        <button onClick={() => setOpen(true)}>Open Command Palette</button>
        <CommandPalette
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(item) => {
            console.log('Selected:', item);
            setOpen(false);
          }}
          items={sampleItems}
          emptyState={
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div>No commands found</div>
            </div>
          }
        />
      </div>
    );
  },
};
