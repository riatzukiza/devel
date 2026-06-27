import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, type TabItem } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'AI IDE/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/tabs.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const sampleTabs: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Overview</h3>
        <p style={{ margin: 0, color: '#75715e' }}>
          This is the overview tab content. It can contain any React components.
        </p>
      </div>
    ),
  },
  {
    id: 'details',
    label: 'Details',
    content: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Details</h3>
        <p style={{ margin: 0, color: '#75715e' }}>
          This tab shows detailed information about the selected item.
        </p>
      </div>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    content: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Settings</h3>
        <p style={{ margin: 0, color: '#75715e' }}>
          Configure your preferences here.
        </p>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    items: sampleTabs,
    variant: 'default',
    size: 'md',
  },
};

export const Pills: Story = {
  args: {
    items: sampleTabs,
    variant: 'pills',
    size: 'md',
  },
};

export const Underline: Story = {
  args: {
    items: sampleTabs,
    variant: 'underline',
    size: 'md',
  },
};

export const Enclosed: Story = {
  args: {
    items: sampleTabs,
    variant: 'enclosed',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Small</h4>
        <Tabs items={sampleTabs} size="sm" />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Medium</h4>
        <Tabs items={sampleTabs} size="md" />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Large</h4>
        <Tabs items={sampleTabs} size="lg" />
      </div>
    </div>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Tabs
      items={[
        { id: 'inbox', label: 'Inbox', badge: '12' },
        { id: 'drafts', label: 'Drafts', badge: '3' },
        { id: 'sent', label: 'Sent' },
        { id: 'archive', label: 'Archive', badge: '99+' },
      ]}
    />
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs
      items={[
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'search', label: 'Search', icon: '🔍' },
        { id: 'notifications', label: 'Alerts', icon: '🔔', badge: '5' },
        { id: 'profile', label: 'Profile', icon: '👤' },
      ]}
    />
  ),
};

export const Closable: Story = {
  render: () => {
    const [items, setItems] = useState(sampleTabs);
    
    return (
      <Tabs
        items={items}
        showClose
        onClose={(id) => setItems(prev => prev.filter(t => t.id !== id))}
      />
    );
  },
};

import { useState } from 'react';

export const Addable: Story = {
  render: () => {
    const [items, setItems] = useState(sampleTabs);
    const [counter, setCounter] = useState(1);
    
    return (
      <Tabs
        items={items}
        addable
        onAdd={() => {
          setCounter(c => c + 1);
          setItems(prev => [
            ...prev,
            {
              id: `tab-${counter}`,
              label: `Tab ${counter}`,
              content: <div style={{ padding: '16px' }}>New tab {counter} content</div>,
            },
          ]);
        }}
      />
    );
  },
};

export const Vertical: Story = {
  render: () => (
    <div style={{ height: '300px' }}>
      <Tabs
        items={sampleTabs}
        orientation="vertical"
      />
    </div>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs
      items={[
        { id: 'tab1', label: 'Active' },
        { id: 'tab2', label: 'Disabled', disabled: true },
        { id: 'tab3', label: 'Also Active' },
      ]}
    />
  ),
};

export const ControlledSelection: Story = {
  render: () => {
    const [value, setValue] = useState('overview');
    
    return (
      <div>
        <Tabs
          items={sampleTabs}
          value={value}
          onChange={setValue}
        />
        <p style={{ marginTop: '16px', color: '#75715e' }}>
          Selected: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

export const IDEStyle: Story = {
  render: () => (
    <div style={{ 
      background: '#1e1f1c', 
      borderRadius: '8px', 
      overflow: 'hidden',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Tabs
        items={[
          {
            id: 'index.ts',
            label: 'index.ts',
            icon: 'TS',
            content: (
              <pre style={{ 
                padding: '16px', 
                margin: 0, 
                color: '#f8f8f2',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
{`export { Button } from './Button';
export { Badge } from './Badge';
export { Card } from './Card';
export { Input } from './Input';`}
              </pre>
            ),
          },
          {
            id: 'Button.tsx',
            label: 'Button.tsx',
            icon: 'TSX',
            content: (
              <pre style={{ 
                padding: '16px', 
                margin: 0, 
                color: '#f8f8f2',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
{`export function Button({ variant, children }) {
  return (
    <button className={variant}>
      {children}
    </button>
  );
}`}
              </pre>
            ),
          },
          {
            id: 'package.json',
            label: 'package.json',
            icon: 'JSON',
            content: (
              <pre style={{ 
                padding: '16px', 
                margin: 0, 
                color: '#f8f8f2',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
{`{
  "name": "@open-hax/uxx",
  "version": "0.1.0"
}`}
              </pre>
            ),
          },
        ]}
        variant="enclosed"
        showClose
      />
    </div>
  ),
};
