import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'url', 'tel'],
      description: 'Type of input',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input',
    },
    variant: {
      control: 'select',
      options: ['default', 'filled', 'unstyled'],
      description: 'Visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input has an error',
    },
  },
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/input.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      <Input variant="default" placeholder="Default variant" />
      <Input variant="filled" placeholder="Filled variant" />
      <Input variant="unstyled" placeholder="Unstyled variant" />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="url" placeholder="URL input" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      <Input 
        error 
        errorMessage="This field is required" 
        placeholder="Required field"
        id="error-input"
      />
      <Input 
        type="email"
        error 
        errorMessage="Please enter a valid email address" 
        placeholder="Email"
        id="email-error"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      <Input disabled placeholder="Disabled input" />
      <Input disabled value="Disabled with value" readOnly />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div style={{ maxWidth: '300px' }}>
      <Input readonly value="This is read-only content" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      <Input 
        type="search" 
        placeholder="Search..." 
        leftIcon={<span>🔍</span>}
      />
      <Input 
        type="email" 
        placeholder="Email address" 
        leftIcon={<span>📧</span>}
      />
      <Input 
        type="password" 
        placeholder="Password" 
        rightIcon={<span>👁️</span>}
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div style={{ maxWidth: '300px' }}>
      <Input required placeholder="Required field *" />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          Username *
        </label>
        <Input 
          placeholder="Enter username" 
          required
          id="username"
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          Email *
        </label>
        <Input 
          type="email"
          placeholder="Enter email" 
          required
          id="email"
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          Password *
        </label>
        <Input 
          type="password"
          placeholder="Enter password" 
          required
          id="password"
        />
      </div>
    </form>
  ),
};
