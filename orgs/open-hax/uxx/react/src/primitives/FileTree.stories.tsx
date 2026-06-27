import type { Meta, StoryObj } from '@storybook/react';
import { FileTree, type FileTreeItem } from './FileTree';
import { useState } from 'react';

const meta: Meta<typeof FileTree> = {
  title: 'AI IDE/FileTree',
  component: FileTree,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/file-tree.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileTree>;

const sampleItems: FileTreeItem[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          { id: 'Button.tsx', name: 'Button.tsx', type: 'file', size: 1024, badge: 'M' },
          { id: 'Badge.tsx', name: 'Badge.tsx', type: 'file', size: 512 },
          { id: 'Card.tsx', name: 'Card.tsx', type: 'file', size: 2048 },
        ],
      },
      {
        id: 'hooks',
        name: 'hooks',
        type: 'folder',
        children: [
          { id: 'useTheme.ts', name: 'useTheme.ts', type: 'file', size: 256 },
          { id: 'useLocalStorage.ts', name: 'useLocalStorage.ts', type: 'file', size: 384 },
        ],
      },
      {
        id: 'utils',
        name: 'utils',
        type: 'folder',
        children: [
          { id: 'helpers.ts', name: 'helpers.ts', type: 'file', size: 128 },
          { id: 'constants.ts', name: 'constants.ts', type: 'file', size: 64 },
        ],
      },
      { id: 'index.ts', name: 'index.ts', type: 'file', size: 512 },
      { id: 'App.tsx', name: 'App.tsx', type: 'file', size: 1536 },
    ],
  },
  {
    id: 'tests',
    name: 'tests',
    type: 'folder',
    children: [
      { id: 'Button.test.tsx', name: 'Button.test.tsx', type: 'file', size: 768 },
      { id: 'Badge.test.tsx', name: 'Badge.test.tsx', type: 'file', size: 512 },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file', size: 1024 },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', size: 256 },
  { id: 'README.md', name: 'README.md', type: 'file', size: 2048 },
  { id: '.gitignore', name: '.gitignore', type: 'file', size: 32 },
];

export const Default: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    
    return (
      <div style={{ width: '300px', background: '#272822', padding: '16px', borderRadius: '8px' }}>
        <FileTree
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
          onDoubleClick={(item) => console.log('Open file:', item.name)}
        />
      </div>
    );
  },
};

export const WithSearch: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    const [search, setSearch] = useState('');
    
    return (
      <div style={{ width: '300px', background: '#272822', padding: '16px', borderRadius: '8px' }}>
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '8px',
            padding: '8px',
            background: '#3e3d32',
            border: 'none',
            borderRadius: '4px',
            color: '#f8f8f2',
          }}
        />
        <FileTree
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
          search={search}
        />
      </div>
    );
  },
};

export const WithFileSizes: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    
    return (
      <div style={{ width: '350px', background: '#272822', padding: '16px', borderRadius: '8px' }}>
        <FileTree
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
          showSize
        />
      </div>
    );
  },
};

export const WithoutIcons: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    
    return (
      <div style={{ width: '300px', background: '#272822', padding: '16px', borderRadius: '8px' }}>
        <FileTree
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
          showIcons={false}
        />
      </div>
    );
  },
};

export const WithContextMenu: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    
    return (
      <div style={{ width: '300px', background: '#272822', padding: '16px', borderRadius: '8px' }}>
        <FileTree
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
          onContextMenu={(item, e) => {
            console.log('Context menu for:', item.name, e);
            alert(`Context menu: ${item.name}`);
          }}
        />
        <p style={{ marginTop: '16px', color: '#75715e', fontSize: '12px' }}>
          Right-click on items for context menu
        </p>
      </div>
    );
  },
};

export const WithBadges: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    
    const itemsWithBadges: FileTreeItem[] = [
      {
        id: 'git',
        name: 'git',
        type: 'folder',
        children: [
          { id: 'main', name: 'main', type: 'folder', badge: 'default' },
          { id: 'feature', name: 'feature/auth', type: 'folder', badge: 'active' },
          { id: 'staging', name: 'staging', type: 'folder' },
        ],
      },
      ...sampleItems.slice(0, 3),
    ];
    
    return (
      <div style={{ width: '300px', background: '#272822', padding: '16px', borderRadius: '8px' }}>
        <FileTree
          items={itemsWithBadges}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
        />
      </div>
    );
  },
};

export const CompactView: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string>();
    
    return (
      <div style={{ width: '250px', background: '#272822', padding: '8px', borderRadius: '8px' }}>
        <FileTree
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
          indentSize={12}
        />
      </div>
    );
  },
};
