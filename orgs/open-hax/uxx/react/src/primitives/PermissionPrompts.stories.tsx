import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  PermissionPrompts,
  type PermissionRequest,
  type InputPrompt,
  type PermissionResponse,
} from './PermissionPrompts';

const meta: Meta<typeof PermissionPrompts> = {
  title: 'Primitives/PermissionPrompts',
  component: PermissionPrompts,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    permissions: {
      control: 'object',
      description: 'Pending permission requests',
    },
    prompts: {
      control: 'object',
      description: 'Pending input prompts',
    },
    onPermissionResponse: {
      action: 'permission-response',
      description: 'Callback for permission response',
    },
    onPromptResponse: {
      action: 'prompt-response',
      description: 'Callback for input prompt response',
    },
    autoFocusInput: {
      control: 'boolean',
      description: 'Auto-focus input fields',
    },
    showMetadata: {
      control: 'boolean',
      description: 'Show permission metadata',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          minHeight: '300px',
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
type Story = StoryObj<typeof PermissionPrompts>;

// Sample data
const samplePermission: PermissionRequest = {
  id: 'perm-1',
  title: 'Read File',
  sessionId: 'sess-123',
  metadata: { path: '/src/core/handler.ts' },
};

const samplePermissionWithCommand: PermissionRequest = {
  id: 'perm-2',
  title: 'Execute Command',
  sessionId: 'sess-456',
  metadata: { command: 'npm run build' },
  timeoutMs: 30000,
};

const samplePrompt: InputPrompt = {
  id: 'prompt-1',
  title: 'Input Required',
  body: { prompt: 'What is the target environment?' },
  placeholder: 'e.g., production, staging',
};

const sampleMultilinePrompt: InputPrompt = {
  id: 'prompt-2',
  title: 'Description',
  body: 'Provide a detailed description of the changes:',
  placeholder: 'Enter your description...',
  multiline: true,
};

// Empty state
export const Empty: Story = {
  args: {
    permissions: [],
    prompts: [],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Single permission request
export const SinglePermission: Story = {
  args: {
    permissions: [samplePermission],
    prompts: [],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Permission with command and timeout
export const PermissionWithCommand: Story = {
  args: {
    permissions: [samplePermissionWithCommand],
    prompts: [],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Multiple permissions
export const MultiplePermissions: Story = {
  args: {
    permissions: [samplePermission, samplePermissionWithCommand],
    prompts: [],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Single input prompt
export const SinglePrompt: Story = {
  args: {
    permissions: [],
    prompts: [samplePrompt],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Multiline prompt
export const MultilinePrompt: Story = {
  args: {
    permissions: [],
    prompts: [sampleMultilinePrompt],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Multiple prompts
export const MultiplePrompts: Story = {
  args: {
    permissions: [],
    prompts: [samplePrompt, sampleMultilinePrompt],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Mixed: permissions and prompts
export const Mixed: Story = {
  args: {
    permissions: [samplePermission],
    prompts: [samplePrompt],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Hidden metadata
export const HiddenMetadata: Story = {
  args: {
    permissions: [samplePermission],
    prompts: [],
    showMetadata: false,
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Default response highlighted
export const DefaultAlways: Story = {
  args: {
    permissions: [
      {
        ...samplePermission,
        defaultResponse: 'always',
      },
    ],
    prompts: [],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

export const DefaultReject: Story = {
  args: {
    permissions: [
      {
        ...samplePermission,
        defaultResponse: 'reject',
      },
    ],
    prompts: [],
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
};

// Interactive demo
const PermissionPromptsInteractive = () => {
  const [permissions, setPermissions] = useState<PermissionRequest[]>([
    { id: 'perm-1', title: 'Read File', metadata: { path: '/src/index.ts' } },
  ]);
  const [prompts, setPrompts] = useState<InputPrompt[]>([
    { id: 'prompt-1', title: 'Branch Name', body: { prompt: 'Enter the branch name:' } },
  ]);
  const [log, setLog] = useState<string[]>([]);

  const handlePermissionResponse = (id: string, response: PermissionResponse) => {
    setLog((l) => [...l, `Permission ${id}: ${response}`]);
    setPermissions((p) => p.filter((perm) => perm.id !== id));
  };

  const handlePromptResponse = (id: string, response: string) => {
    setLog((l) => [...l, `Prompt ${id}: "${response}"`]);
    setPrompts((p) => p.filter((pr) => pr.id !== id));
  };

  const addPermission = () => {
    const id = `perm-${Date.now()}`;
    setPermissions((p) => [
      ...p,
      { id, title: 'Write File', metadata: { path: `/src/file-${Date.now()}.ts` } },
    ]);
  };

  const addPrompt = () => {
    const id = `prompt-${Date.now()}`;
    setPrompts((p) => [
      ...p,
      { id, title: 'Input', body: { prompt: 'Enter a value:' } },
    ]);
  };

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ width: '400px' }}>
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={addPermission}
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
            Add Permission
          </button>
          <button
            onClick={addPrompt}
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
            Add Prompt
          </button>
        </div>
        <div
          style={{
            border: '1px solid #3e3d32',
            borderRadius: '4px',
            overflow: 'hidden',
            minHeight: '300px',
          }}
        >
          <PermissionPrompts
            permissions={permissions}
            prompts={prompts}
            onPermissionResponse={handlePermissionResponse}
            onPromptResponse={handlePromptResponse}
          />
        </div>
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
        <div style={{ fontSize: '12px', color: '#75715e', marginBottom: '8px' }}>Event Log:</div>
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
  render: () => <PermissionPromptsInteractive />,
  parameters: {
    layout: 'padded',
  },
};

// Long list scrolling
export const LongList: Story = {
  args: {
    permissions: Array.from({ length: 5 }, (_, i) => ({
      id: `perm-${i}`,
      title: `Permission ${i + 1}`,
      metadata: { path: `/src/file-${i}.ts` },
    })),
    prompts: Array.from({ length: 3 }, (_, i) => ({
      id: `prompt-${i}`,
      title: `Prompt ${i + 1}`,
      body: { prompt: `Enter value ${i + 1}:` },
    })),
    onPermissionResponse: () => {},
    onPromptResponse: () => {},
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          height: '500px',
          border: '1px solid #3e3d32',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
