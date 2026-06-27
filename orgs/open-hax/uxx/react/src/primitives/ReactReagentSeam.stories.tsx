import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ReactReagentSeam, useAdapter, type Adapter } from './ReactReagentSeam';

const meta: Meta<typeof ReactReagentSeam> = {
  title: 'Primitives/ReactReagentSeam',
  component: ReactReagentSeam,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    initialState: {
      control: 'object',
      description: 'Initial host state',
    },
    scopeClass: {
      control: 'text',
      description: 'CSS class for scoping styles',
    },
    onMount: {
      action: 'mount',
      description: 'Callback when seam is mounted',
    },
    onUnmount: {
      action: 'unmount',
      description: 'Callback when seam is unmounted',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReactReagentSeam>;

// Default host and donor renderers
const defaultRenderHost = (adapter: Adapter) => (
  <>
    <h2>Host Panel</h2>
    <p>
      Ready state:{' '}
      <span className="status" data-testid="adapter-ready-state">
        {adapter.readyState}
      </span>
    </p>
    <p>
      Event count:{' '}
      <strong data-testid="host-event-count">{adapter.eventCount}</strong>
    </p>
    <p>
      Host count:{' '}
      <strong data-testid="host-count-value">{adapter.hostCount}</strong>
    </p>
    <button
      type="button"
      data-testid="host-count-increment"
      onClick={adapter.incrementHostCount}
    >
      Increment host count
    </button>
  </>
);

const defaultRenderDonor = (adapter: Adapter) => (
  <>
    <h3>Donor Panel</h3>
    <p>
      Host count handoff:{' '}
      <strong data-testid="donor-host-count">{adapter.hostCount}</strong>
    </p>
    <p>
      Events received:{' '}
      <strong data-testid="donor-event-count">{adapter.eventCount}</strong>
    </p>
    <button
      type="button"
      data-testid="donor-event-trigger"
      onClick={adapter.emitDonorEvent}
    >
      Emit donor event
    </button>
  </>
);

// Default story
export const Default: Story = {
  args: {
    initialState: { hostCount: 0, eventCount: 0 },
    renderHost: defaultRenderHost,
    renderDonor: defaultRenderDonor,
  },
};

// With initial state
export const WithInitialState: Story = {
  args: {
    initialState: { hostCount: 5, eventCount: 3 },
    renderHost: defaultRenderHost,
    renderDonor: defaultRenderDonor,
  },
};

// Custom scope class
export const CustomScopeClass: Story = {
  args: {
    initialState: {},
    scopeClass: 'custom-seam-scope',
    renderHost: defaultRenderHost,
    renderDonor: defaultRenderDonor,
  },
};

// Interactive demo with lifecycle logging
const InteractiveDemo = () => {
  const [mounted, setMounted] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const handleMount = () => {
    setLog((l) => [...l, `${new Date().toLocaleTimeString()}: Seam mounted`]);
  };

  const handleUnmount = () => {
    setLog((l) => [...l, `${new Date().toLocaleTimeString()}: Seam unmounted`]);
  };

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setMounted(!mounted)}
            style={{
              padding: '8px 16px',
              background: mounted ? '#f92672' : '#a6e22e',
              color: '#272822',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {mounted ? 'Unmount Seam' : 'Mount Seam'}
          </button>
        </div>
        {mounted && (
          <ReactReagentSeam
            initialState={{ hostCount: 0, eventCount: 0 }}
            renderHost={defaultRenderHost}
            renderDonor={defaultRenderDonor}
            onMount={handleMount}
            onUnmount={handleUnmount}
          />
        )}
      </div>
      <div
        style={{
          width: '250px',
          background: '#1e1f1c',
          borderRadius: '4px',
          padding: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: '12px', color: '#75715e', marginBottom: '8px' }}>
          Lifecycle Log:
        </div>
        {log.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#75715e' }}>No events yet</div>
        ) : (
          log.map((entry, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                color: '#f8f8f2',
                padding: '4px 0',
                borderBottom: '1px solid #3e3d32',
              }}
            >
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

// Nested component using useAdapter hook
const NestedDonorComponent = () => {
  const adapter = useAdapter();

  if (!adapter) {
    return <div style={{ color: '#f92672' }}>Error: No adapter context</div>;
  }

  return (
    <div style={{ padding: '8px', background: 'rgba(102, 217, 239, 0.1)', borderRadius: '4px' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Nested Component</h4>
      <p style={{ margin: 0, fontSize: '12px' }}>
        This component uses <code>useAdapter()</code> hook to access state.
      </p>
      <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
        Host count: <strong>{adapter.hostCount}</strong>
      </p>
    </div>
  );
};

export const WithNestedComponent: Story = {
  args: {
    initialState: { hostCount: 0, eventCount: 0 },
    renderHost: defaultRenderHost,
    renderDonor: (adapter) => (
      <>
        <h3>Donor with Nested</h3>
        <p>
          Host count: <strong>{adapter.hostCount}</strong>
        </p>
        <NestedDonorComponent />
      </>
    ),
  },
};

// Custom styled panels
const customRenderHost = (adapter: Adapter) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #66d9ef20, #a6e22e20)',
      padding: '16px',
      borderRadius: '8px',
    }}
  >
    <h2 style={{ margin: '0 0 12px 0' }}>Custom Styled Host</h2>
    <p style={{ margin: '0 0 8px 0' }}>
      Status: <span style={{ color: '#a6e22e' }}>{adapter.readyState}</span>
    </p>
    <p style={{ margin: '0 0 8px 0' }}>
      Count: <strong>{adapter.hostCount}</strong>
    </p>
    <button onClick={adapter.incrementHostCount}>Increment</button>
  </div>
);

const customRenderDonor = (adapter: Adapter) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #f9267220, #fd971f20)',
      padding: '16px',
      borderRadius: '8px',
    }}
  >
    <h3 style={{ margin: '0 0 12px 0' }}>Custom Styled Donor</h3>
    <p style={{ margin: '0 0 8px 0' }}>
      Events: <strong>{adapter.eventCount}</strong>
    </p>
    <button onClick={adapter.emitDonorEvent}>Emit Event</button>
  </div>
);

export const CustomStyling: Story = {
  args: {
    initialState: {},
    renderHost: customRenderHost,
    renderDonor: customRenderDonor,
  },
};

// Bidirectional state sharing demo
const BidirectionalDemo = () => {
  const [sharedValue, setSharedValue] = useState(0);

  return (
    <div>
      <div
        style={{
          marginBottom: '12px',
          padding: '8px',
          background: '#1e1f1c',
          borderRadius: '4px',
        }}
      >
        <span style={{ fontSize: '12px', color: '#75715e' }}>
          External state: <strong style={{ color: '#f8f8f2' }}>{sharedValue}</strong>
        </span>
        <button
          onClick={() => setSharedValue((v) => v + 10)}
          style={{
            marginLeft: '8px',
            padding: '4px 8px',
            background: '#66d9ef',
            color: '#272822',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Add 10
        </button>
      </div>
      <ReactReagentSeam
        initialState={{ hostCount: sharedValue, eventCount: 0 }}
        renderHost={(adapter) => (
          <>
            <h2>Host</h2>
            <p>
              Initial count from external:{' '}
              <strong>{adapter.hostCount}</strong>
            </p>
            <p>
              Internal changes:{' '}
              <strong>{adapter.hostCount - sharedValue}</strong>
            </p>
            <button onClick={adapter.incrementHostCount}>
              Increment Internally
            </button>
          </>
        )}
        renderDonor={(adapter) => (
          <>
            <h3>Donor</h3>
            <p>
              Can read host count:{' '}
              <strong>{adapter.hostCount}</strong>
            </p>
            <button onClick={adapter.emitDonorEvent}>Emit Event</button>
          </>
        )}
      />
    </div>
  );
};

export const BidirectionalState: Story = {
  render: () => <BidirectionalDemo />,
};
