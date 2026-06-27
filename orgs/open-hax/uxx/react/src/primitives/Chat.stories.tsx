import type { Meta, StoryObj } from '@storybook/react';
import { Chat, type ChatMessage } from './Chat';
import { useState } from 'react';

const meta: Meta<typeof Chat> = {
  title: 'AI IDE/Chat',
  component: Chat,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/chat.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chat>;

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'How do I create a new component in this library?',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    role: 'assistant',
    content: `To create a new component in the @open-hax/uxx library:

1. **Create the contract** - Add an EDN file in \`orgs/open-hax/uxx/contracts/\`
2. **Implement React** - Create the component in \`orgs/open-hax/uxx/react/src/primitives/\`
3. **Implement Reagent** - Create the CLJS namespace in \`orgs/open-hax/uxx/reagent/src/\`
4. **Add stories** - Create Storybook stories for documentation

\`\`\`bash
# Example structure
orgs/open-hax/uxx/contracts/my-component.edn
orgs/open-hax/uxx/react/src/primitives/MyComponent.tsx
orgs/open-hax/uxx/reagent/src/devel/ui/primitives/my_component.cljs
\`\`\``,
    timestamp: new Date(Date.now() - 290000),
  },
  {
    id: '3',
    role: 'user',
    content: 'What about design tokens?',
    timestamp: new Date(Date.now() - 200000),
  },
  {
    id: '4',
    role: 'assistant',
    content: `Design tokens are defined in \`orgs/open-hax/uxx/tokens/\`:

- **colors.ts** - Monokai-based color palette
- **spacing.ts** - 4px base unit scale
- **typography.ts** - Font families, sizes, weights
- **motion.ts** - Duration and easing functions
- **shadows.ts** - Elevation and z-index

Import them with:
\`\`\`typescript
import { tokens } from '@open-hax/uxx/tokens';
const style = { color: tokens.colors.text.default };
\`\`\``,
    timestamp: new Date(Date.now() - 190000),
  },
];

export const Default: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            setMessages([...messages, {
              id: String(Date.now()),
              role: 'user',
              content,
              timestamp: new Date(),
            }]);
          }}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    return (
      <div style={{ height: '400px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            setMessages([...messages, {
              id: String(Date.now()),
              role: 'user',
              content,
              timestamp: new Date(),
            }]);
          }}
          placeholder="Ask me anything about the codebase..."
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const [messages] = useState<ChatMessage[]>(sampleMessages);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={() => {}}
          loading
        />
      </div>
    );
  },
};

export const WithCustomAvatars: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            setMessages([...messages, {
              id: String(Date.now()),
              role: 'user',
              content,
            }]);
          }}
          avatar="🤖"
          userAvatar="👤"
        />
      </div>
    );
  },
};

export const WithTimestamps: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            setMessages([...messages, {
              id: String(Date.now()),
              role: 'user',
              content,
              timestamp: new Date(),
            }]);
          }}
          showTimestamps
        />
      </div>
    );
  },
};

export const WithActions: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
      ...sampleMessages,
      {
        id: '5',
        role: 'assistant',
        content: 'Here is the code for a Button component:',
        timestamp: new Date(),
        actions: ['copy', 'regenerate', 'explain'],
      },
    ]);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            setMessages([...messages, {
              id: String(Date.now()),
              role: 'user',
              content,
            }]);
          }}
          onMessageAction={(action, message) => {
            console.log('Action:', action, 'Message:', message);
          }}
        />
      </div>
    );
  },
};

// Story 7: Session/Connection enhancements

export const WithSessionHeader: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            setMessages([...messages, {
              id: String(Date.now()),
              role: 'user',
              content,
              timestamp: new Date(),
            }]);
          }}
          sessionId="sess-abc123"
          connected={true}
          showHeader
        />
      </div>
    );
  },
};

export const WithDisconnectedStatus: Story = {
  render: () => {
    const [messages] = useState<ChatMessage[]>(sampleMessages);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={() => {}}
          sessionId="sess-disconnected"
          connected={false}
          showHeader
        />
      </div>
    );
  },
};

export const WithPendingMessage: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
    const [pending, setPending] = useState<ChatMessage | undefined>(undefined);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            const pendingMsg: ChatMessage = {
              id: 'pending',
              role: 'user',
              content,
            };
            setPending(pendingMsg);
            
            // Simulate server response
            setTimeout(() => {
              setMessages([...messages, { ...pendingMsg, id: String(Date.now()), timestamp: new Date() }]);
              setPending(undefined);
            }, 2000);
          }}
          pendingMessage={pending}
          showTimestamps
        />
      </div>
    );
  },
};

export const WithHeaderAndPending: Story = {
  render: () => {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
    const [pending, setPending] = useState<ChatMessage | undefined>(undefined);
    
    return (
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            const pendingMsg: ChatMessage = {
              id: 'pending',
              role: 'user',
              content,
            };
            setPending(pendingMsg);
            
            setTimeout(() => {
              setMessages([...messages, { ...pendingMsg, id: String(Date.now()), timestamp: new Date() }]);
              setPending(undefined);
            }, 1500);
          }}
          sessionId="sess-xyz789"
          connected={true}
          pendingMessage={pending}
          showHeader
          showTimestamps
        />
      </div>
    );
  },
};

// Interactive demo showing all features
const InteractiveChatDemo = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
  const [pending, setPending] = useState<ChatMessage | undefined>(undefined);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(false);
  
  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setConnected(!connected)}
          style={{
            padding: '4px 12px',
            background: connected ? '#a6e22e' : '#fd971f',
            color: '#272822',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {connected ? 'Disconnect' : 'Connect'}
        </button>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 3000);
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
          Simulate AI Response
        </button>
      </div>
      <div style={{ height: '500px' }}>
        <Chat
          messages={messages}
          onSend={(content) => {
            const pendingMsg: ChatMessage = {
              id: 'pending',
              role: 'user',
              content,
            };
            setPending(pendingMsg);
            
            setTimeout(() => {
              setMessages([...messages, { ...pendingMsg, id: String(Date.now()), timestamp: new Date() }]);
              setPending(undefined);
            }, 1000);
          }}
          sessionId="sess-interactive"
          connected={connected}
          pendingMessage={pending}
          loading={loading}
          showHeader
          showTimestamps
        />
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveChatDemo />,
};
