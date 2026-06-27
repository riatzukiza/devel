import type { Meta, StoryObj } from '@storybook/react';
import { RichTextEditor } from './RichTextEditor';
import { useState } from 'react';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Text Editors/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/rich-text-editor.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

const sampleContent = `**Welcome to the Rich Text Editor!**

This is a *WYSIWYG* editor with a toolbar.

You can make text **bold**, *italic*, or ~~strikethrough~~.

## Features

- Easy to use toolbar
- Keyboard shortcuts
- Image support
- Links

> This is a blockquote

[Click here for GitHub](https://github.com)`;

export const Default: Story = {
  args: {
    defaultValue: sampleContent,
    format: 'markdown',
    toolbar: true,
    placeholder: 'Start writing...',
    minHeight: '200px',
  },
};

export const Empty: Story = {
  args: {
    placeholder: 'Start writing your content...',
    minHeight: '200px',
  },
};

export const WithoutToolbar: Story = {
  args: {
    defaultValue: sampleContent,
    toolbar: false,
    minHeight: '200px',
  },
};

export const Readonly: Story = {
  args: {
    defaultValue: sampleContent,
    readonly: true,
    minHeight: '200px',
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: sampleContent,
    disabled: true,
    minHeight: '200px',
  },
};

export const HTMLFormat: Story = {
  args: {
    defaultValue: '<h2>HTML Content</h2><p>This is <strong>HTML</strong> format.</p>',
    format: 'html',
    minHeight: '200px',
  },
};

export const WithMaxHeight: Story = {
  args: {
    defaultValue: sampleContent + '\n\n' + Array(50).fill('More content here.').join('\n\n'),
    maxHeight: '300px',
    minHeight: '200px',
  },
};

export const WithAutofocus: Story = {
  args: {
    defaultValue: sampleContent,
    autofocus: true,
    minHeight: '200px',
  },
};

export const WithoutSpellcheck: Story = {
  args: {
    defaultValue: sampleContent,
    spellcheck: false,
    minHeight: '200px',
  },
};

const ControlledEditor = () => {
  const [value, setValue] = useState(sampleContent);
  return (
    <div>
      <RichTextEditor
        value={value}
        onChange={setValue}
        minHeight="150px"
      />
      <div style={{ marginTop: 16 }}>
        <h4>Output (Markdown):</h4>
        <pre style={{ 
          padding: 12, 
          background: '#272822', 
          borderRadius: 4, 
          fontSize: 12,
          overflow: 'auto',
          maxHeight: 200,
        }}>
          {value}
        </pre>
      </div>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledEditor />,
};

const EditorWithMentions = () => {
  const [value, setValue] = useState('Try typing @ to mention someone!');
  
  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      mentions={{
        items: [
          { id: 'alice', name: 'Alice Chen', description: 'Frontend Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
          { id: 'bob', name: 'Bob Martinez', description: 'Backend Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
          { id: 'carol', name: 'Carol Davis', description: 'Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol' },
          { id: 'david', name: 'David Kim', description: 'DevOps Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
        ],
        trigger: '@',
      }}
      minHeight="150px"
    />
  );
};

export const WithMentions: Story = {
  render: () => <EditorWithMentions />,
};

const EditorWithImageUpload = () => {
  const [value, setValue] = useState('Upload images by pasting or using the toolbar!');
  
  const handleImageUpload = async (file: File): Promise<string> => {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Return a fake URL
    return URL.createObjectURL(file);
  };
  
  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      imageUpload={handleImageUpload}
      minHeight="200px"
    />
  );
};

export const WithImageUpload: Story = {
  render: () => <EditorWithImageUpload />,
};

const EditorWithSave = () => {
  const [value, setValue] = useState(sampleContent);
  const [saved, setSaved] = useState<string | null>(null);
  
  const handleSave = (content: string) => {
    setSaved(content);
    console.log('Saved content:', content);
  };
  
  return (
    <div>
      <RichTextEditor
        value={value}
        onChange={setValue}
        onSave={handleSave}
        minHeight="150px"
      />
      <div style={{ marginTop: 16, fontSize: 12, color: '#75715e' }}>
        Press Ctrl+S or Cmd+S to save
      </div>
      {saved && (
        <div style={{ marginTop: 16 }}>
          <h4>Saved Content:</h4>
          <pre style={{ 
            padding: 12, 
            background: '#272822', 
            borderRadius: 4, 
            fontSize: 12,
            maxHeight: 200,
            overflow: 'auto',
          }}>
            {saved}
          </pre>
        </div>
      )}
    </div>
  );
};

export const WithSaveHandler: Story = {
  render: () => <EditorWithSave />,
};
