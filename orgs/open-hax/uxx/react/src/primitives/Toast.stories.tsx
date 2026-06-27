import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast, ToastContainer } from './Toast';
import { Button } from './Button';

const meta: Meta<typeof ToastContainer> = {
  title: 'AI IDE/Toast',
  component: ToastContainer,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/toast.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

const ToastDemo = () => {
  const { addToast, dismissAll } = useToast();
  
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button
        variant="primary"
        onClick={() => addToast({ 
          type: 'info', 
          message: 'File saved successfully',
          title: 'Info',
        })}
      >
        Info Toast
      </Button>
      <Button
        variant="primary"
        onClick={() => addToast({ 
          type: 'success', 
          message: 'Operation completed!',
          title: 'Success',
        })}
      >
        Success Toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => addToast({ 
          type: 'warning', 
          message: 'This action cannot be undone',
          title: 'Warning',
          duration: 8000,
        })}
      >
        Warning Toast
      </Button>
      <Button
        variant="danger"
        onClick={() => addToast({ 
          type: 'error', 
          message: 'Failed to save file',
          title: 'Error',
          action: { label: 'Retry', onClick: () => console.log('Retrying...') },
        })}
      >
        Error Toast
      </Button>
      <Button
        variant="ghost"
        onClick={dismissAll}
      >
        Dismiss All
      </Button>
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Top Right</h4>
        <ToastProvider position="top-right">
          <ToastDemo />
        </ToastProvider>
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Bottom Left</h4>
        <ToastProvider position="bottom-left">
          <ToastDemo />
        </ToastProvider>
      </div>
    </div>
  ),
};

export const WithAction: Story = {
  render: () => {
    const ToastWithAction = () => {
      const { addToast } = useToast();
      
      return (
        <Button
          variant="primary"
          onClick={() => addToast({
            type: 'info',
            message: 'File has been deleted',
            title: 'Undo Available',
            duration: 10000,
            action: {
              label: 'Undo',
              onClick: () => alert('File restored!'),
            },
          })}
        >
          Delete File
        </Button>
      );
    };
    
    return (
      <ToastProvider>
        <ToastWithAction />
      </ToastProvider>
    );
  },
};

export const Persistent: Story = {
  render: () => {
    const PersistentToast = () => {
      const { addToast } = useToast();
      
      return (
        <Button
          variant="secondary"
          onClick={() => addToast({
            type: 'warning',
            message: 'This toast will not auto-dismiss. Click the X to close it.',
            title: 'Persistent Toast',
            duration: 0,
          })}
        >
          Show Persistent Toast
        </Button>
      );
    };
    
    return (
      <ToastProvider>
        <PersistentToast />
      </ToastProvider>
    );
  },
};

export const Stacked: Story = {
  render: () => {
    const StackedToasts = () => {
      const { addToast } = useToast();
      
      return (
        <Button
          variant="primary"
          onClick={() => {
            addToast({ type: 'info', message: 'First notification' });
            setTimeout(() => addToast({ type: 'success', message: 'Second notification' }), 200);
            setTimeout(() => addToast({ type: 'warning', message: 'Third notification' }), 400);
          }}
        >
          Show Multiple Toasts
        </Button>
      );
    };
    
    return (
      <ToastProvider>
        <StackedToasts />
      </ToastProvider>
    );
  },
};
