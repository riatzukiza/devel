import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Primitives/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the modal dialog',
    },
    closable: {
      control: 'boolean',
      description: 'Whether the modal can be closed by user interaction',
    },
    closeOnBackdrop: {
      control: 'boolean',
      description: 'Whether clicking the backdrop closes the modal',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing Escape closes the modal',
    },
  },
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/modal.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Helper component for stateful stories
const ModalDemo = ({ 
  size = 'md', 
  title = 'Modal Title',
  closable = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size={size}
        title={title}
        closable={closable}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          This is the modal content. You can put any React components here.
        </p>
        <p style={{ margin: '8px 0 0 0', color: 'var(--color-fg-muted)' }}>
          Try pressing Escape, clicking the backdrop, or using Tab to navigate.
        </p>
      </Modal>
    </div>
  );
};

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const Small: Story = {
  render: () => <ModalDemo size="sm" title="Small Modal" />,
};

export const Large: Story = {
  render: () => <ModalDemo size="lg" title="Large Modal" />,
};

export const ExtraLarge: Story = {
  render: () => <ModalDemo size="xl" title="Extra Large Modal" />,
};

export const FullScreen: Story = {
  render: () => <ModalDemo size="full" title="Full Screen Modal" />,
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <ModalDemo size="sm" title="Small" />
      <ModalDemo size="md" title="Medium" />
      <ModalDemo size="lg" title="Large" />
      <ModalDemo size="xl" title="Extra Large" />
    </div>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => <ModalDemo closable={false} />,
};

export const NoBackdropClose: Story = {
  render: () => <ModalDemo closeOnBackdrop={false} />,
};

export const NoEscapeClose: Story = {
  render: () => <ModalDemo closeOnEscape={false} />,
};

export const WithHeaderSlot: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span>Warning</span>
            </div>
          }
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              I Understand
            </Button>
          }
        >
          <p style={{ margin: 0 }}>
            This modal has a custom header with an icon.
          </p>
        </Modal>
      </div>
    );
  },
};

export const WithoutFooter: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Simple Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Information">
          <p style={{ margin: 0 }}>
            This modal has no footer, only a title and content.
          </p>
        </Modal>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Create New Item</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Create New Item"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Create
              </Button>
            </>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Name</label>
              <input 
                type="text" 
                placeholder="Enter item name"
                style={{ 
                  width: '100%', 
                  padding: '8px 12px',
                  background: 'var(--color-bg-darker)',
                  border: '1px solid var(--color-fg-subtle)',
                  borderRadius: '4px',
                  color: 'inherit'
                }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Description</label>
              <textarea
                placeholder="Enter item description"
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--color-bg-darker)',
                  border: '1px solid var(--color-fg-subtle)',
                  borderRadius: '4px',
                  color: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </form>
        </Modal>
      </div>
    );
  },
};
