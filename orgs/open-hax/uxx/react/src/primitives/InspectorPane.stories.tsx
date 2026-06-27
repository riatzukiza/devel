import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { InspectorPane, type Entity, type ErrorState } from './InspectorPane';

const meta: Meta<typeof InspectorPane> = {
  title: 'Primitives/InspectorPane',
  component: InspectorPane,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    selection: {
      control: 'object',
      description: 'Currently selected entity',
    },
    error: {
      control: 'object',
      description: 'Error state if loading failed',
    },
    onRetry: {
      action: 'retry',
      description: 'Callback to retry after error',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '320px',
          height: '500px',
          border: '1px solid #3e3d32',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InspectorPane>;

// Sample entities
const sampleEntity: Entity = {
  id: 'session-123',
  key: 'session-123-key',
  title: 'OpenCode Session: API Integration',
  type: 'info',
  text: 'This session covers the integration of the new API endpoints with the existing authentication flow.',
  time: '2 hours ago',
  timestamp: Date.now() - 7200000,
};

const sessionEntity: Entity = {
  id: 'session-456',
  key: 'session-456-key',
  title: 'Debug: Memory Leak Investigation',
  type: 'error',
  text: 'Investigating memory leak in the worker process. Initial findings suggest connection pool is not releasing references.',
  time: '45 min ago',
  timestamp: Date.now() - 2700000,
};

const fileEntity: Entity = {
  id: 'file-789',
  key: 'file-789-key',
  title: 'src/core/handler.cljs',
  type: 'file',
  text: '(ns core.handler\n  (:require [ring.util.response :as response]))\n\n(defn handle-request [req]\n  (response/response {:status :ok}))',
  time: 'just now',
  timestamp: Date.now(),
};

// Default with selection
export const WithSelection: Story = {
  args: {
    selection: sampleEntity,
    error: null,
  },
};

// Error type entity
export const ErrorTypeEntity: Story = {
  args: {
    selection: sessionEntity,
    error: null,
  },
};

// File type entity with code
export const FileEntity: Story = {
  args: {
    selection: fileEntity,
    error: null,
  },
};

// Empty state
export const EmptyState: Story = {
  args: {
    selection: null,
    error: null,
  },
};

// Error state with retry
export const WithError: Story = {
  args: {
    selection: null,
    error: {
      message: 'Failed to load entity details. The server is not responding.',
      retryable: true,
    },
  },
};

// Error state without retry
export const WithNonRetryableError: Story = {
  args: {
    selection: null,
    error: {
      message: 'Entity not found. It may have been deleted.',
      retryable: false,
    },
  },
};

// Error with selection still visible
export const ErrorWithContext: Story = {
  args: {
    selection: sampleEntity,
    error: {
      message: 'Failed to load related context.',
      retryable: true,
    },
  },
};

// Interactive with toggle
const InspectorPaneWithToggle = () => {
  const [selection, setSelection] = useState<Entity | null>(sampleEntity);
  const [error, setError] = useState<ErrorState | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            setSelection(sampleEntity);
            setError(null);
          }}
          style={{
            padding: '4px 12px',
            background: '#66d9ef',
            color: '#272822',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Load Session
        </button>
        <button
          onClick={() => {
            setSelection(fileEntity);
            setError(null);
          }}
          style={{
            padding: '4px 12px',
            background: '#a6e22e',
            color: '#272822',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Load File
        </button>
        <button
          onClick={() => {
            setSelection(null);
            setError(null);
          }}
          style={{
            padding: '4px 12px',
            background: '#75715e',
            color: '#f8f8f2',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            setError({ message: 'Failed to load context.', retryable: true });
          }}
          style={{
            padding: '4px 12px',
            background: '#f92672',
            color: '#f8f8f2',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Trigger Error
        </button>
      </div>
      <div
        style={{
          width: '320px',
          height: '500px',
          border: '1px solid #3e3d32',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <InspectorPane
          selection={selection}
          error={error}
          onRetry={() => {
            setError(null);
          }}
        />
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InspectorPaneWithToggle />,
  parameters: {
    layout: 'padded',
  },
};

// Custom detail renderer
const CustomDetailRenderer: React.FC<{ entity: Entity }> = ({ entity }) => (
  <div
    style={{
      padding: '12px',
      background: 'rgba(102, 217, 239, 0.1)',
      border: '1px solid #66d9ef',
      borderRadius: '4px',
    }}
  >
    <div style={{ fontSize: '11px', color: '#66d9ef', marginBottom: '8px' }}>
      CUSTOM RENDERER
    </div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8f8f2' }}>
      {entity.title}
    </div>
    <div style={{ marginTop: '8px', fontSize: '12px', color: '#75715e' }}>
      ID: {entity.id}
    </div>
    {entity.metadata && (
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#75715e' }}>
        Metadata: {JSON.stringify(entity.metadata)}
      </div>
    )}
  </div>
);

export const WithCustomRenderer: Story = {
  args: {
    selection: {
      ...sampleEntity,
      metadata: { source: 'workbench', version: '1.0' },
    },
    error: null,
  },
  render: (args) => (
    <InspectorPane
      {...args}
      renderDetail={(entity) => <CustomDetailRenderer entity={entity} />}
    />
  ),
};

// Minimal entity (no type, no text)
export const MinimalEntity: Story = {
  args: {
    selection: {
      id: 'minimal-1',
      title: 'Minimal Entity',
    },
    error: null,
  },
};

// Story 3.2: Context stories

// With context items
const contextEntities: Entity[] = [
  {
    id: 'ctx-1',
    key: 'ctx-1-key',
    title: 'Related Session: Auth Fix',
    type: 'session',
    time: '3 hours ago',
  },
  {
    id: 'ctx-2',
    key: 'ctx-2-key',
    title: 'Parent Task: Integration Epic',
    type: 'task',
    time: '1 day ago',
  },
  {
    id: 'ctx-3',
    key: 'ctx-3-key',
    title: 'config/endpoints.edn',
    type: 'file',
    time: '2 days ago',
  },
];

export const WithContext: Story = {
  args: {
    selection: sampleEntity,
    context: contextEntities,
    error: null,
  },
};

// Empty context (shows "No related context")
export const WithEmptyContext: Story = {
  args: {
    selection: sampleEntity,
    context: [],
    error: null,
  },
};

// Interactive context selection
const InspectorPaneWithContextSelection = () => {
  const [selected, setSelected] = useState<Entity>(sampleEntity);
  const [context] = useState<Entity[]>(contextEntities);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          fontSize: '12px',
          color: '#75715e',
          padding: '8px',
          background: '#1e1f1c',
          borderRadius: '4px',
        }}
      >
        Click on context items to select them. This demonstrates the onContextSelect callback.
      </div>
      <div
        style={{
          width: '320px',
          height: '500px',
          border: '1px solid #3e3d32',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <InspectorPane
          selection={selected}
          context={context}
          onContextSelect={(entity) => {
            setSelected(entity);
          }}
        />
      </div>
    </div>
  );
};

export const InteractiveContext: Story = {
  render: () => <InspectorPaneWithContextSelection />,
  parameters: {
    layout: 'padded',
  },
};

// Custom context item renderer
const CustomContextItemRenderer: React.FC<{ entity: Entity }> = ({ entity }) => (
  <div
    style={{
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(166, 226, 46, 0.1)',
      border: '1px solid #a6e22e',
      borderRadius: '4px',
    }}
  >
    <span style={{ fontSize: '10px', color: '#a6e22e', textTransform: 'uppercase' }}>
      {entity.type || 'item'}
    </span>
    <span style={{ fontSize: '12px', color: '#f8f8f2' }}>{entity.title}</span>
  </div>
);

export const WithCustomContextRenderer: Story = {
  args: {
    selection: sampleEntity,
    context: contextEntities,
    error: null,
  },
  render: (args) => (
    <InspectorPane
      {...args}
      renderContextItem={(entity) => <CustomContextItemRenderer entity={entity} />}
    />
  ),
};

// Story 3.3: Pin & Compare stories

import type { PinnedEntry } from './InspectorPane';

// With pinned entities
const pinnedEntities: PinnedEntry[] = [
  {
    key: 'session-123',
    selection: sampleEntity,
    context: contextEntities.slice(0, 1),
  },
  {
    key: 'session-456',
    selection: sessionEntity,
    context: [],
  },
];

export const WithPinned: Story = {
  args: {
    selection: sampleEntity,
    context: contextEntities,
    pinned: pinnedEntities,
    activePinnedKey: 'session-123',
    error: null,
  },
};

// Interactive pin/unpin demonstration
const InspectorPaneWithPinning = () => {
  const [selected, setSelected] = useState<Entity>(sampleEntity);
  const [context] = useState<Entity[]>(contextEntities);
  const [pinned, setPinned] = useState<PinnedEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handlePin = (entity: Entity) => {
    const key = entity.key || entity.id;
    if (pinned.length >= 5) return;
    if (pinned.some((p) => p.key === key)) return;

    const newEntry: PinnedEntry = {
      key,
      selection: entity,
      context: [],
    };
    setPinned([...pinned, newEntry]);
    setActiveKey(key);
  };

  const handleUnpin = (key: string) => {
    const newPinned = pinned.filter((p) => p.key !== key);
    setPinned(newPinned);
    if (activeKey === key) {
      setActiveKey(newPinned.length > 0 ? newPinned[0].key : null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          fontSize: '12px',
          color: '#75715e',
          padding: '8px',
          background: '#1e1f1c',
          borderRadius: '4px',
        }}
      >
        <strong>Pin & Compare Demo:</strong> Click "Pin" to pin the current selection.
        Click pinned tabs to switch between them. Click × to unpin.
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setSelected(sampleEntity)}
          style={{
            padding: '4px 12px',
            background: '#66d9ef',
            color: '#272822',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Load Session
        </button>
        <button
          onClick={() => setSelected(sessionEntity)}
          style={{
            padding: '4px 12px',
            background: '#f92672',
            color: '#f8f8f2',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Load Error Session
        </button>
        <button
          onClick={() => setSelected(fileEntity)}
          style={{
            padding: '4px 12px',
            background: '#a6e22e',
            color: '#272822',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Load File
        </button>
      </div>
      <div
        style={{
          width: '320px',
          height: '500px',
          border: '1px solid #3e3d32',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <InspectorPane
          selection={selected}
          context={context}
          pinned={pinned}
          activePinnedKey={activeKey}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onSetActive={setActiveKey}
          onContextSelect={setSelected}
        />
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#75715e',
          padding: '8px',
          background: '#1e1f1c',
          borderRadius: '4px',
        }}
      >
        Pinned: {pinned.length}/5 | Active: {activeKey || 'none'}
      </div>
    </div>
  );
};

export const InteractivePinning: Story = {
  render: () => <InspectorPaneWithPinning />,
  parameters: {
    layout: 'padded',
  },
};

// Max pinned reached (5 items)
const maxPinnedEntities: PinnedEntry[] = [
  { key: 'p1', selection: { id: 'p1', title: 'Entity 1' }, context: [] },
  { key: 'p2', selection: { id: 'p2', title: 'Entity 2' }, context: [] },
  { key: 'p3', selection: { id: 'p3', title: 'Entity 3' }, context: [] },
  { key: 'p4', selection: { id: 'p4', title: 'Entity 4' }, context: [] },
  { key: 'p5', selection: { id: 'p5', title: 'Entity 5' }, context: [] },
];

export const MaxPinnedReached: Story = {
  args: {
    selection: { id: 'new', title: 'Cannot Pin This' },
    context: [],
    pinned: maxPinnedEntities,
    activePinnedKey: 'p1',
    error: null,
  },
};

// Already pinned (pin button hidden)
export const AlreadyPinned: Story = {
  args: {
    selection: sampleEntity,
    context: contextEntities,
    pinned: [{ key: 'session-123', selection: sampleEntity, context: [] }],
    activePinnedKey: 'session-123',
    error: null,
  },
};
